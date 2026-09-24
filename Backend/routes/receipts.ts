import db from '../config/database.js';
import type { Request, Response } from "express";
import express from "express";
import { protect } from '../middleware/authMiddleware.js';

const SHIPPING_COST = 6;

interface OrderReceiptSummary {
  id: number;
  total_price: number;
  date: Date;
}

interface TierReceipt {
  id: number;
  tier: string;
  total_price: number;
  date: Date;
}

interface OrderReceiptDetail extends OrderReceiptSummary {
  products: {
    product_id: number;
    product_name: string;
    price: number;
    prints: {
      print_name: string;
    }[]
  }[]
}

type Receipt =
  { type: 'order'; data: OrderReceiptSummary } |
  { type: 'order'; data: OrderReceiptDetail } |
  { type: 'tier'; data: TierReceipt } 

interface CartItem {
  productId: number;
  printIds?: number[];
}

type ValidationResult =
  { success: true, products: { id: number; price: number }[] } |
  { success: false, status: number, error: string }

const findAllOrderReceipts = async (userId: number): Promise<OrderReceiptSummary[]> => {
  const result = await db.query(`
    SELECT 
      ro.id,
      ro.total_price,
      ro.date
    FROM receipts_orders ro
    WHERE ro.user_id = $1
    ORDER BY ro.date DESC;
    `, [userId]
  );
  return result.rows;
};

const findAllTierReceipts = async (userId: number): Promise<TierReceipt[]> => {
  const result = await db.query(`
    SELECT 
      rt.id,
      rt.total_price,
      rt.date,
      t.name AS tier
    FROM receipts_tiers rt
    JOIN tiers t ON rt.tier_id = t.id
    WHERE rt.user_id = $1
    ORDER BY rt.date DESC;
    `, [userId]
  );
  return result.rows;
};

const findOrderReceiptById = async (userId: number, id: number): Promise<OrderReceiptDetail | undefined> => {
  const receipt = await db.query(`
    SELECT
      id,
      total_price,
      date
    FROM receipts_orders
    WHERE user_id = $1 AND id = $2;
    `, [userId, id]
  );

  if (!receipt.rows[0]) {
    return undefined;
  }

  const products = await db.query(`
    SELECT
      pr.id,
      pr.product_id,
      pr.price,
      p.name
    FROM products_receipts pr
    JOIN products p ON pr.product_id = p.id
    WHERE pr.receipt_id = $1
    ORDER BY p.name;
    `, [id]
  );

  const productIds = products.rows.map(row => row.id);

  const prints = await db.query(`
    SELECT 
      ppr.products_receipt_id,
      pri.name
    FROM prints_products_receipt ppr
    JOIN prints pri ON ppr.print_id = pri.id
    WHERE ppr.products_receipt_id = ANY($1);
    `, [productIds]
  );

  const productList = products.rows.map(product => {
    const matchingPrints = prints.rows
      .filter(print => print.products_receipt_id === product.id)
      .map(print => ({ 'print_name': print.name }));

    return {
      product_id: product.product_id,
      product_name: product.name,
      price: product.price,
      prints: matchingPrints
    }
  });

  return {
    id: receipt.rows[0].id,
    total_price: receipt.rows[0].total_price,
    date: receipt.rows[0].date,
    products: productList,
  }
};

const findTierReceiptById = async (userId: number, id: number): Promise<TierReceipt | undefined> => {
  const result = await db.query(`
    SELECT
      rt.id,
      rt.total_price,
      rt.date,
      t.name AS tier
      FROM receipts_tiers rt
      JOIN tiers t ON rt.tier_id = t.id
      WHERE rt.user_id = $1 AND rt.id = $2
    `, [userId, id]
  );
  return result.rows[0];
};

const getUserTierId = async (userId: number): Promise<number | null> => {
  const result = await db.query<{ tier_id: number }>(
    "SELECT tier_id FROM users WHERE id = $1"
    ,[userId]
  );
  return result.rows[0]?.tier_id ?? null;
};

const validateCartAccess = async (userId: number, cart: CartItem[]): Promise<ValidationResult> => {
  if (cart.length === 0) {
    return { success: false, status: 400, error: "Cart is empty" };
  }
  
  const userTierId = await getUserTierId(userId);
  if (userTierId === null) {
    return { success: false, status: 403, error: 'No valid tier'};
  }
  const productIds = cart.map(item => item.productId);

  const result = await db.query(`
    SELECT id, tier_id, price FROM products WHERE id = ANY($1::int[]);
    `, [productIds]
  );

  const tierById = new Map(result.rows.map(r => [r.id, r.tier_id]));

  for (const item of cart) {
    const requiredTierId = tierById.get(item.productId);

    if (requiredTierId === undefined) {
      return { success: false, status: 404, error: `Product ${item.productId} not found`};
    }

    if (userTierId < requiredTierId) {
      return { success: false, status: 403, error: `Product ${item.productId} requires tier ${requiredTierId}`};
    }
  }

  return { success: true, products: result.rows.map(r => ({ id: r.id, price: r.price })) };
};

const createReceipt = async (
  userId: number, 
  cart: CartItem[]
): Promise<ValidationResult | { success: true; data: OrderReceiptDetail }> => {
  const validation = await validateCartAccess(userId, cart);

  if (!validation.success) {
    return validation;
  }

  const priceById = new Map(validation.products.map(p => [p.id, p.price]));
  const totalPrice = cart.reduce((sum, item) => sum + priceById.get(item.productId)!, SHIPPING_COST);

  const client = await db.connect();
  let newReceiptId: number;
  try {
    await client.query('BEGIN');
    const receiptResult = await client.query(`
      INSERT INTO receipts_orders (user_id, total_price)
      VALUES ($1, $2)
      RETURNING id;
      `, [userId, totalPrice]
    );

    newReceiptId = receiptResult.rows[0].id;

    for (const item of cart) {
      const productReceipt = await client.query(`
        INSERT INTO products_receipts (product_id, receipt_id, price)
        VALUES ($1, $2, $3)
        RETURNING id;
        `, [item.productId, newReceiptId, priceById.get(item.productId)]
      );
      const productReceiptId = productReceipt.rows[0].id;

      for (const printId of item.printIds ?? []) {
        await client.query(`
          INSERT INTO prints_products_receipt (print_id, products_receipt_id)
          VALUES ($1, $2);
          `, [printId, productReceiptId]
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const receipt = await findOrderReceiptById(userId, newReceiptId);
  return { success: true, data: receipt! };
}

export const createReceiptController = async (req: Request<{}, {}, { cart: CartItem[]}>, res: Response) => {
  try {
    const userId = req.user?.userId;
    const cart = req.body.cart;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!Array.isArray(cart)) {
      return res.status(400).json({ success: false, error: "Cart must be an array" });
    }

    const result = await createReceipt(userId, cart);

    if (!result.success) {
      return res.status(result.status).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to create receipt', error);
    res.status(500).json({ success: false, error: 'Failed to create receipt' });
  }
}

const getAllReceipts = async (userId: number): Promise<Receipt[]> => {
  const [orders, tiers] = await Promise.all([
    findAllOrderReceipts(userId),
    findAllTierReceipts(userId),
  ]);

  return [
    ...orders.map(o => ({ type: 'order' as const, data: o })),
    ...tiers.map(t => ({ type: 'tier' as const, data: t })),
  ].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
};

export const getAllReceiptsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
  
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
  
    const receipts = await getAllReceipts(userId);
    res.status(200).json({ success: true, data: receipts });
  } catch (error) {
    console.error('Failed to fetch receipts', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve receipts'});
  }
};

const getReceiptById = async (
  userId: number,
  id: number,
  type: 'order' | 'tier'
) : Promise<Receipt | null> => {
  if (type === 'order') {
    const receipt = await findOrderReceiptById(userId, id);
    return receipt ? { type: 'order', data: receipt } : null;
  }

  const receipt = await findTierReceiptById(userId, id);
  return receipt ? { type: 'tier', data: receipt } : null;
};

export const getReceiptByIdController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { type, id } = req.params;
  
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
  
    if (type !== 'order' && type !== 'tier') {
      return res.status(400).json({ success: false, error: 'Invalid receipt type' });
    }

    const receiptId = Number(id);
    if (Number.isNaN(receiptId)) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }
  
    const receipt = await getReceiptById(userId, receiptId, type);
  
    if (!receipt) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }
  
    res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    console.error('Failed to fetch receipt', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve receipt'});
  }
};

const router = express.Router();

router.get('/', protect, getAllReceiptsController);
router.get('/:type/:id', protect, getReceiptByIdController);
router.post('/', protect, createReceiptController);

export default router;