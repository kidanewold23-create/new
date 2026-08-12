/* ==========================================================================
   SUPABASE DATABASE MIGRATION & SCHEMA CHECKER (NODE.JS)
   ========================================================================== */

import { supabase } from "./store.js";

console.log("Checking Supabase Database Schema...");

export async function checkDatabaseSchema() {
  try {
    const { data: courses, error } = await supabase.from("courses").select("id, title, status");
    if (error) {
      console.log("Supabase Schema Status:", error.message);
      console.log("👉 Execute 'supabase_schema.sql' in your Supabase SQL Editor (https://supabase.com/dashboard/project/icdjgtfiqwwdqtvwuyaw/sql) to initialize tables!");
    } else {
      console.log("🎉 Supabase Database Connected & Live! Found courses:", courses ? courses.length : 0);
    }
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

checkDatabaseSchema();
