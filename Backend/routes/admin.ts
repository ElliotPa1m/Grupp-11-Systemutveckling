import db from '../config/database.js';
import type { Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import express from "express";

interface Admin {
  id: number;
  username: string;
  password: string;
}

const findByUsername = async (username: string): Promise<Admin | undefined> => {
  const result = await db.query(`
    SELECT * FROM admin WHERE name = $1
    `, [username]
  );
  return result.rows[0];
}

export const loginAdmin = async (
  req: Request<{}, {}, { username: string, password: string }>, res: Response
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Password or username is missing' });
    }

    const admin = await findByUsername(username);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const isValid = await bcrypt.compare(password, admin.password)
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid username or password'});
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