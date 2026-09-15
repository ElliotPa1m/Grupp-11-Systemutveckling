import express from "express";
import cors from 'cors';
import pool from './config/database.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_URL
  : 'http://localhost:5173',
  credentials: true 
}));

app.use(express.json());

app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

const start = async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(PORT, async () => {
      console.log(`Server is running on PORT:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database error:', error);
    process.exit(1);
  }
}

start();