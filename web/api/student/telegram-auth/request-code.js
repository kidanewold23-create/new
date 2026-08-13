import handler from "../../index.js";

export default async function requestCodeHandler(req, res) {
  if (req && (!req.url || req.url === "/")) req.url = "/api/student/telegram-auth/request-code";
  return await handler(req, res);
}
