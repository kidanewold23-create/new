import { dbStore } from "../../../db/store.js";

export default async function verifyCodeHandler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    let body = req.body || {};
    if (typeof body === "string" && body.trim()) {
      try { body = JSON.parse(body); } catch (_e) {}
    }
    const identifier = body.identifier || body.phone || body.username || body.phone_number;
    const code = body.code || body.otp;
    const result = await dbStore.verifyStudentTelegramOtp(identifier, code);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
