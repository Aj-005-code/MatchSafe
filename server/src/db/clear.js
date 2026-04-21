import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function clearDb() {
    try {
        await pool.query('TRUNCATE TABLE users_identity CASCADE;');
        console.log('✅ All users, profiles, and connections have been cleared for the demo.');
    } catch (err) {
        console.error('❌ Failed to clear users:', err.message);
    } finally {
        await pool.end();
    }
}

clearDb();
