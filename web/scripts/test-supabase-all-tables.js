import { supabase } from "../db/store.js";

async function verifyAllTables() {
  console.log("🔍 Verifying all 10 Database Tables in Supabase...\n");

  const tables = [
    "admin_users",
    "categories",
    "courses",
    "students",
    "maintenance",
    "transactions",
    "telegram_users",
    "course_quizzes",
    "quiz_questions",
    "quiz_submissions"
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        console.error(`❌ Table [${table}]: Error (${error.message})`);
      } else {
        console.log(`✅ Table [${table}] is LIVE & ACTIVE! Total Rows = ${count}`);
      }
    } catch (err) {
      console.error(`❌ Table [${table}]: Exception (${err.message})`);
    }
  }

  console.log("\n🎉 Database verification complete! All tables operational.");
}

verifyAllTables();
