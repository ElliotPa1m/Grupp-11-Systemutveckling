import type { RequestHandler } from "express";
import pool from "../config/database.js";

export type TierType = "standard" | "plus" | "gold";

const tierLevel: Record<TierType, number> = {
  standard: 1,
  plus: 2,
  gold: 3,
};

function isTierType(value: unknown): value is TierType {
  return (
    value === "standard" ||
    value === "plus" ||
    value === "gold"
  );
}


/*  userId: string | number ska vara number i nästa fix. */
export async function getUserTierById(
   userId: string | number
): Promise<TierType | null> {
  const result = await pool.query<{ name: string }>(
    `SELECT t.name
     FROM users AS u
     INNER JOIN tiers AS t
       ON u.tier_id = t.id
     WHERE u.id = $1`,
    [userId]
  );

  const tierName = result.rows[0]?.name;

  if (!isTierType(tierName)) {
    return null;
  }

  return tierName;
}

export function requireTier(
  minimumTier: TierType
): RequestHandler {
  return async (req, res, next): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        code: "AUTH_REQUIRED",
        message: "User must be authenticated",
      });
      return;
    }

    try {
      const userTier = await getUserTierById(userId);

      if (!userTier) {
        res.status(403).json({
          code: "TIER_REQUIRED",
          message: "User has no valid tier",
        });
        return;
      }

      const hasRequiredTier =
        tierLevel[userTier] >= tierLevel[minimumTier];

      if (!hasRequiredTier) {
        res.status(403).json({
          code: "TIER_UPGRADE_REQUIRED",
          message: `This feature requires ${minimumTier} tier or higher`,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}