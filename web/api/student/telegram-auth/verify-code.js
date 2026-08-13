import handler from "../../index.js";

export default async function verifyCodeHandler(req, res) {
  if (req && (!req.url || req.url === "/")) req.url = "/api/student/telegram-auth/verify-code";
  return await handler(req, res);
}
