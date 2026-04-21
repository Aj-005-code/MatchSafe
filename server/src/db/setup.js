import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function setup() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  try {
    await pool.query(sql);
    console.log('✅ Database schema applied successfully');
  } catch (err) {
    console.error('❌ Schema setup failed:', err.message);
  } finally {
    await pool.end();
  }
}

setup();
