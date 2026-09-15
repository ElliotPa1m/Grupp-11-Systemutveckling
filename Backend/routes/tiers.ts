import { Router } from "express";
import pool from "../config/database.js";

const router = Router();

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

export default router;
