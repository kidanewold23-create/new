import pkg from "pg";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pkg;

async function applyFullSchema() {
  console.log("🔌 Connecting directly to Supabase PostgreSQL Database...\n");

  const dbPassword = process.env.DB_PASSWORD || "Abcd@1234##1";
  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.icdjgtfiqwwdqtvwuyaw.supabase.co:5432/postgres`;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Successfully connected to Supabase PostgreSQL Database!");

    const schemaPath = resolve(__dirname, "../supabase_schema.sql");
    const sqlScript = readFileSync(schemaPath, "utf-8");

    console.log("📜 Executing DDL Schema (`supabase_schema.sql`)...\n");
    await client.query(sqlScript);
    console.log("🎉 All 10 Database Tables, Indexes, Seed Data & Policies Successfully Created!");

    // Verify created tables
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

  } catch (err) {
    console.error("❌ Database execution error:", err.message);
  } finally {
    await client.end();
  }
}

applyFullSchema();
