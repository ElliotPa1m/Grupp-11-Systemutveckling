import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import pool from "../config/database.js";

const router = Router();


type TierRow = {
  id: number;
  name: string;
  price: number;
};


/* ingen inloggning krävs*/
router.get("/", async (_req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, name, price
            FROM tiers
            ORDER BY price`
        );

        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

/* hämta den inloggade användarens tier */
router.get("/me", protect, async (req, res, next) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
        code: "AUTH_REQUIRED",
        message: "User must be authenticated",
    });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.price
       FROM users AS u
       INNER JOIN tiers AS t
         ON u.tier_id = t.id
       WHERE u.id = $1`,
      [userId]
    );

    const tier = result.rows[0];

    if (!tier) {
      res.status(404).json({
        code: "TIER_NOT_FOUND",
        message: "Tier not found",
      });
      return;
    }

    res.status(200).json(tier);
  } catch (error) {
    next(error);
  }
});

router.post("/subscribe", protect, async (req, res, next) => {
  const userId = req.user?.userId;
  const tierId: unknown = req.body?.tierId;

  if (!userId) {
    res.status(401).json({
      code: "AUTH_REQUIRED",
      message: "User must be authenticated",
    });
    return;
  }

  if (
    typeof tierId !== "number" ||
    !Number.isInteger(tierId) ||
    tierId <= 0
  ) {
    res.status(400).json({
      code: "INVALID_TIER_ID",
      message: "tierId must be a positive integer",
    });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tierResult = await client.query<TierRow>(
      `SELECT id, name, price
       FROM tiers
       WHERE id = $1`,
      [tierId]
    );

    const selectedTier = tierResult.rows[0];

    if (!selectedTier) {
      await client.query("ROLLBACK");

      res.status(404).json({
        code: "TIER_NOT_FOUND",
        message: "Selected tier does not exist",
      });
      return;
    }

     const userResult = await client.query(
      `UPDATE users
       SET tier_id = $1
       WHERE id = $2
       RETURNING id, tier_id`,
      [selectedTier.id, userId]
    );

    const updatedUser = userResult.rows[0];

    if (!updatedUser) {
      await client.query("ROLLBACK");

      res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "User does not exist",
      });
      return;
    }

    const receiptResult = await client.query(
      `INSERT INTO receipts_tiers
         (user_id, tier_id, total_price)
       VALUES
         ($1, $2, $3)
       RETURNING id, date, user_id, tier_id, total_price`,
      [userId, selectedTier.id, selectedTier.price]
    );

    const receipt = receiptResult.rows[0];

       await client.query("COMMIT");

    res.status(201).json({
      message: "Tier subscription completed",
      tier: selectedTier,
      receipt,
    });
  } catch (error) {
  await client.query("ROLLBACK");
    next(error);
  } finally {
        client.release();
  }

});


export default router;
