import pkg from "pg";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pkg;

async function testConnections() {
  const dbPassword = process.env.DB_PASSWORD || "Abcd@1234##1";
  
  const hosts = [
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.icdjgtfiqwwdqtvwuyaw.supabase.co:5432/postgres`,
    `postgresql://postgres.icdjgtfiqwwdqtvwuyaw:${encodeURIComponent(dbPassword)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.icdjgtfiqwwdqtvwuyaw:${encodeURIComponent(dbPassword)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.icdjgtfiqwwdqtvwuyaw:${encodeURIComponent(dbPassword)}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.icdjgtfiqwwdqtvwuyaw:${encodeURIComponent(dbPassword)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
  ];

  for (const connStr of hosts) {
    const hostDisplay = connStr.split("@")[1].split("/")[0];
    console.log(`Testing connection to: ${hostDisplay} ...`);
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log(`✅ CONNECTED SUCCESSFULLY to ${hostDisplay}!`);

      const schemaPath = resolve(__dirname, "../supabase_schema.sql");
      const sqlScript = readFileSync(schemaPath, "utf-8");

      console.log("📜 Executing DDL Schema (`supabase_schema.sql`)...\n");
      await client.query(sqlScript);
      console.log("🎉 All 10 Database Tables, Indexes, Seed Data & Policies Successfully Created!");

      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);

      console.log("\n📊 Active Public Tables in Supabase:");
      res.rows.forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.table_name}`);
      });

      await client.end();
      return;
    } catch (err) {
      console.log(`❌ Connection failed for ${hostDisplay}: ${err.message}`);
      try { await client.end(); } catch (_e) {}
    }
  }
}

testConnections();
