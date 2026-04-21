import pool from './src/config/db.js';

async function run() {
    try {
        const res = await pool.query('SELECT * FROM connections');
        console.log('CONNECTIONS:', JSON.stringify(res.rows, null, 2));

        const res2 = await pool.query('SELECT user_id, name, email FROM users_identity');
        console.log('USERS:', JSON.stringify(res2.rows, null, 2));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}
run();
