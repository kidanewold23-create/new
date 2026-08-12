const { Client } = require('pg');
const DB_URL = "postgresql://postgres:[YOUR-PASSWORD]@db.yrelqbvkxwdkzaraydfz.supabase.co:5432/postgres";

async function reloadSchema() {
    const client = new Client({
        connectionString: DB_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log("Schema reloaded!");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

reloadSchema();
