import { dbStore } from "../../../db/store.js";

export default async function pollStatusHandler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const host = req.headers?.host || "localhost";
    const protocol = req.headers?.["x-forwarded-proto"] || "https";
    const url = new URL(req.url || "/api", `${protocol}://${host}`);
    const code = url.searchParams.get("code") || (req.query ? req.query.code : "");
    const result = await dbStore.pollStudentTelegramOtp(code);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ verified: false, error: err.message });
  }
}
