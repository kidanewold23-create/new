import handler from "../index.js";

export default async function telegramAuthHandler(req, res) {
  if (req && (!req.url || req.url === "/")) req.url = "/api/student/telegram-auth";
  return await handler(req, res);
}
