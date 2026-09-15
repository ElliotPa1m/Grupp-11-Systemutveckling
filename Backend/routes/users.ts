import express from "express"
import type { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import pool from "../config/database.js"

const router = express.Router()

interface User {
    id: number
    name: string
    email: string
    tier_id: number
    password: string
}

const findByEmail = async (email: string): Promise<User | undefined> => {
    const result = await pool.query<User>(
        "SELECT * FROM users WHERE email = $1",
        [email]
    )
    return result.rows[0]
}

const getStandardTierId = async (): Promise<number | null> => {
    const result = await pool.query<{ id: number }>(
        "SELECT id FROM tiers WHERE name = $1",
        ["standard"]
    )
    return result.rows[0]?.id ?? null
}

router.post("/register", async (req: Request, res: Response) => {
    try {
        const {name, email, password} = req.body as {
            name?: string
            email?: string
            password?: string
        }

        if (!name || !email || !password) {
            res.status(400).json({success: false, error: "Name, email and password are required"})
            return
        }
        
        const existing = await findByEmail(email)
        if (existing) {
            res.status(409).json({success: false, error: "Email already registered"})
            return
        }

        const standardTierId = await getStandardTierId()
        if (standardTierId === null) {
            res.status(500).json({success: false, error: "Standard tier not found"})
            return
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const result = await pool.query<User>(
            `INSERT INTO users (name, email, tier_id, password)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, tier_id`,
             [name, email, standardTierId, hashedPassword]
        )

        res.status(201).json({success: true, user: result.rows[0]})
    } catch (error) {
        console.error("Register failed", error)
        res.status(500).json({success: false, error: "Registration failed"})
    }
})

router.post("/login", async (req: Request, res: Response) => {
    try {
        const {email, password} = req.body as {email?: string, password?: string}

        if (!email || !password) {
            res.status(400).json({success: false, error: "Email or password is missing"})
            return
        }

        const user = await findByEmail(email)
        if (!user) {
            res.status(401).json({success: false, error: "Invalid email or password"})
            return
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            res.status(401).json({success: false, error: "Invalid email or password"})
            return
        }

        if (!process.env.JWT_SECRET) {
            res.status(500).json({success: false, error: "Server misconfigured"})
            return
        }

        const token = jwt.sign(
            {userId: user.id},
            process.env.JWT_SECRET,
            {expiresIn: "1d"}
        )

        res.status(200).json({success: true, token})
    } catch (error) {
        console.error("Login failed:", error)
        res.status(500).json({success: false, error: "Login failed"})
    }
})

export default router