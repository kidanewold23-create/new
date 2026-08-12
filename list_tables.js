require('dotenv').config();
const { Client } = require('pg');
async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || "postgresql://postgres:[YOUR-PASSWORD]@db.yrelqbvkxwdkzaraydfz.supabase.co:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log(res.rows);
    await client.end();
}
run().catch(console.error);
