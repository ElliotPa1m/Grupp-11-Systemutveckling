import db from '../config/database.js';
import type { Request, Response } from "express";
import express from "express";
import { protect } from '../middleware/authMiddleware.js';

interface OrderReceipt {
  id: number;
  product_name: string;
  total_price: number;
  date: Date;
}

interface TierReceipt {
  id: number;
  tier: string;
  total_price: number;
  date: Date;
}

type Receipt =
  { type: 'order'; data: OrderReceipt } |
  { type: 'tier'; data: TierReceipt };

const findAllOrderReceipts = async (userId: number): Promise<OrderReceipt[]> => {
  const result = await db.query(`
    SELECT 
      ro.id,
      ro.total_price,
      ro.date,
      p.name AS product_name
    FROM receipts_orders ro
    JOIN orders o ON ro.order_id = o.id
    JOIN products p ON o.product_id = p.id
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

const findOrderReceiptById = async (userId: number, id: number): Promise<OrderReceipt | undefined> => {
  const result = await db.query(`
    SELECT
      ro.id,
      ro.total_price,
      ro.date,
      p.name AS product_name
      FROM receipts_orders ro
      JOIN orders o ON ro.order_id = o.id
      JOIN products p ON o.product_id = p.id
      WHERE ro.user_id = $1 AND ro.id = $2
    `, [userId, id]
  );
  return result.rows[0];
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

export default router;