const { Client } = require('pg');

async function testSetAdminTelegramLinkCode(username, code, expiresAtIso) {
    let DB_URL = process.env.DATABASE_URL || "postgresql://postgres:[YOUR-PASSWORD]@db.yrelqbvkxwdkzaraydfz.supabase.co:5432/postgres";
    const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
    
    try {
        console.log("Connecting to", DB_URL);
        await client.connect();
        console.log("Connected. Running query...");
        const res = await client.query(
            "UPDATE admins SET telegram_link_code = $1, telegram_link_expires_at = $2 WHERE username = $3",
            [code, expiresAtIso, username]
        );
        console.log("Query success. Rows affected:", res.rowCount);
        return true;
    } catch (e) {
        console.error("Error setting admin telegram link code via pg:", e.message);
        return false;
    } finally {
        await client.end();
    }
}

testSetAdminTelegramLinkCode("admin", "LINK-123456", new Date().toISOString());
