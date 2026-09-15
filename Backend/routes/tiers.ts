import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import pool from "../config/database.js";

const router = Router();

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
        message: "Tier not found",
      });
      return;
    }

    res.status(200).json(tier);
  } catch (error) {
    next(error);
  }
});

export default router;
