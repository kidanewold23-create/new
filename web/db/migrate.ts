import { createClient } from "npm:@supabase/supabase-js@2.48.1";

const SUPABASE_URL = "https://icdjgtfiqwwdqtvwuyaw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7SjYAbvNDwTXOVBlkuox-g_wMj58uUK";

console.log("Checking Supabase Database Schema...");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function checkDatabaseSchema() {
  try {
    const { data: courses, error } = await supabase.from("courses").select("id, title, status");
    if (error) {
      console.log("Supabase Schema Status:", error.message);
      console.log("👉 Execute 'supabase_schema.sql' in your Supabase SQL Editor (https://supabase.com/dashboard/project/icdjgtfiqwwdqtvwuyaw/sql) to initialize tables!");
    } else {
      console.log("🎉 Supabase Database Connected & Live! Found courses:", courses.length);
    }
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

if (import.meta.main) {
  await checkDatabaseSchema();
}
