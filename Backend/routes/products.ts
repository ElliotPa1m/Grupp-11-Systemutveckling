import express from "express"
import type { Request, Response } from "express"
import pool from "../config/database.js"
import { protect, adminOnly } from "../middleware/authMiddleware.js"

const router = express.Router()

interface Product {
    id: number
    name: string | null
    price: number
    clothes_image: string | null
    description: string | null
    tier_id: number
}

interface Print {
    id: number
    small_print: string | null
    back_print: string | null
}

router.get("/", async (req: Request, res: Response) => {
    try {
        const result = await pool.query<Product>("SELECT * FROM products")
        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to fetch products" })
    }
})

router.get("/:id", async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id)
        if (Number.isNaN(id)) {
            res.status(400).json({ message: "Invalid product id" })
            return
        }

        const productResult = await pool.query<Product>(
            "SELECT * FROM products WHERE id = $1",
            [id]
        )

        const product = productResult.rows[0]

        if (!product) {
            res.status(404).json({ message: "Product not found" })
            return
        }

        const printsResult = await pool.query<Print>("SELECT * FROM prints")

        res.json({ ...product, prints: printsResult.rows })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to fetch product" })
    }
})

router.post("/", protect, adminOnly, async (req: Request, res: Response) => {
    try {
        const { name, price, clothes_image, description, tier_id } = req.body as Partial<Product>

        if (price === undefined || tier_id === undefined) {
            res.status(400).json({ message: "Price and tier_id are required" })
            return
        }

        const result = await pool.query<Product>(
            `INSERT INTO products (name, price, clothes_image, description, tier_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name ?? null, price, clothes_image ?? null, description ?? null, tier_id]
        )

        const created = result.rows[0]

        if (!created) {
            res.status(500).json({ message: "Failed to create product" })
            return
        }

        res.status(201).json(created)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to create product" })
    }
})

router.put("/:id", protect, adminOnly, async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id)
        if (Number.isNaN(id)) {
            res.status(400).json({ message: "Invalid product id" })
            return
        }

        const { name, price, clothes_image, description, tier_id } = req.body as Partial<Product>

        const result = await pool.query<Product>(
            `UPDATE products SET
                name = COALESCE($1, name),
                price = COALESCE($2, price),
                clothes_image = COALESCE($3, clothes_image),
                description = COALESCE($4, description),
                tier_id = COALESCE($5, tier_id)
             WHERE id = $6
             RETURNING *`,
            [name, price, clothes_image, description, tier_id, id]
        )

        const updated = result.rows[0]

        if (!updated) {
            res.status(404).json({ message: "Product not found" })
            return
        }

        res.json(updated)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to update product" })
    }
})

router.delete("/:id", protect, adminOnly, async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id)
        if (Number.isNaN(id)) {
            res.status(400).json({ message: "Invalid product id" })
            return
        }

        const result = await pool.query("DELETE FROM products WHERE id = $1", [id])

        if (result.rowCount === 0) {
            res.status(404).json({ message: "Product not found" })
            return
        }

        res.json({ message: "Product deleted" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to delete product" })
    }
})

export default router