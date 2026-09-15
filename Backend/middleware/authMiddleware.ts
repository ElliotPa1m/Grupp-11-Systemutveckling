import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"

export interface JwtPayload {
    userId: number
    role?: string
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
        res.status(401).json({message: "No token"})
        return
    }

    if (!process.env.JWT_SECRET) {
        res.status(500).json({message: "Server misconfigured"})
        return
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload
        req.user = decoded
        next()
    } catch {
        res.status(401).json({message: "Invalid token"})
    }
}

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "admin") {
        res.status(403).json({message: "Admins only"})
        return
    }
    next()
}