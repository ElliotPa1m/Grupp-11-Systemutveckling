import db from '../config/database.js';
import type { Request, Response } from "express";
import express from "express";

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
}

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
}

export const getAllReceipts = async (userId: number): Promise<Receipt[]> => {
  const [orders, tiers] = await Promise.all([
    findAllOrderReceipts(userId),
    findAllTierReceipts(userId),
  ]);

  return [
    ...orders.map(o => ({ type: 'order' as const, data: o })),
    ...tiers.map(t => ({ type: 'tier' as const, data: t })),
  ].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
