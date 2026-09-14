import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const caCertPath = path.join(process.cwd(), 'certs', 'ca.pem');
const caCert = fs.readFileSync(caCertPath, 'utf8');

const pool = new pg.Pool({
  connectionString: connectionString,

  ssl: {
    rejectUnauthorized: true,
    ca: caCert
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;