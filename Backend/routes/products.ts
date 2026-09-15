import express from "express";
import type { Request, Response } from "express";
import pool from "../config/database.js";
import {protect, adminOnly} from "../middleware/authMiddleware.js";

const router = express.Router()

interface Product {
    id: number
    name: string | null
    no_print: string | null
    small_print: string | null
    back_print: string | null
    price: number
    clothes_image: string | null
    description: string | null
    print_image: string | null
}

router.get("/", async (req: Request, res: Response) => {
    try {
        const result = await pool.query<Product>("SELECT * FROM products")
        res.json(result.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({message: "Failed to fetch products"})
    }
})

router.get("/:id", async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id)
        if (Number.isNaN(id)) {
            res.status(400).json({message: "Invalid product id"})
            return
        }

        const result = await pool.query<Product>(
            "SELECT * FROM products WHERE id = $1",
            [id]
        )

        if (result.rows.length === 0) {
            res.status(404).json({message: "Product not found"})
            return
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({message: "Failed to fetch product"})
    }
})

router.post("/", protect, adminOnly, async (req: Request, res: Response) => {
    try {
        const {
            name,
            no_print,
            small_print,
            back_print,
            price,
            clothes_image,
            description,
            print_image
        } = req.body as Partial<Product>

        if (price === undefined) {
            res.status(400).json({message: "Price is required"})
            return
        }

        const result = await pool.query<Product>(
            `INSERT INTO products
                (name, no_print, small_print, back_print, price, clothes_image, description, print_image)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [name ?? null, no_print ?? null, small_print ?? null, back_print ?? null, price, clothes_image ?? null, description ?? null, print_image ?? null]
        )

        res.status(201).json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({message: "Failed to create product"})
    }
})

router.put("/:id", protect, adminOnly, async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id)
        if (Number.isNaN(id)) {
            res.status(400).json({message: "Invalid product id"})
            return
        }

        const {
            name,
            no_print,
            small_print,
            back_print,
            price,
            clothes_image,
            description,
            print_image
        } = req.body as Partial<Product>

        const result = await pool.query<Product>(
             `UPDATE products SET
                name = COALESCE($1, name),
                no_print = COALESCE($2, no_print),
                small_print = COALESCE($3, small_print),
                back_print = COALESCE($4, back_print),
                price = COALESCE($5, price),
                clothes_image = COALESCE($6, clothes_image),
                description = COALESCE($7, description),
                print_image = COALESCE($8, print_image)
             WHERE id = $9
             RETURNING *`,
            [name, no_print, small_print, back_print, price, clothes_image, description, print_image, id]
        )

        if (result.rows.length === 0) {
            res.status(404).json({message: "Product not found"})
            return
        }

        res.json(result.rows[0])
    } catch (error) {
        console.error(error)
        res.status(500).json({message: "Failed to update product"})
    }
})

router.delete("/:id", protect, adminOnly, async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id)
        if (Number.isNaN(id)) {
            res.status(400).json({message: "invalid product id"})
            return
        }

        const result = await pool.query("DELETE FROM products WHERE id = $1", [id])

        if (result.rowCount === 0) {
            res.status(404).json({message: "Product not found"})
            return
        }

        res.json({message: "Product deleted"})
    } catch (error) {
        console.error(error)
        res.status(500).json({message: "Failed to delete product"})
    }
})

export default router