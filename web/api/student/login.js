import { dbStore } from "../../db/store.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (_e) {}
    }
    const result = await dbStore.authenticateStudent(body || {});
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    console.error("[Vercel /api/student/login Error]:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal Server Error" });
  }
}
