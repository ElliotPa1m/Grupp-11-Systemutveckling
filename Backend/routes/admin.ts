import db from '../config/database.js';
import type { Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import express from "express";

interface Admin {
  id: number;
  name: string;
  password: string;
}

const findByName = async (name: string): Promise<Admin | undefined> => {
  const result = await db.query(`
    SELECT * FROM admin WHERE name = $1
    `, [name]
  );
  return result.rows[0];
}

export const loginAdmin = async (
  req: Request<{}, {}, { name: string, password: string }>, res: Response
) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ success: false, error: 'Password or name is missing' });
    }

    const admin = await findByName(name);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid name or password' });
    }

    const isValid = await bcrypt.compare(password, admin.password)
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid name or password'});
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, error: "Server misconfigured"})
    }

    const token = jwt.sign(
      { userId: admin.id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d"}
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ success: false, error: 'Login failed'});
  }
}

const router = express.Router();

router.post('/login', loginAdmin);

export default router;