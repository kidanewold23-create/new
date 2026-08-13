import handler from "../../index.js";

export default async function pollStatusHandler(req, res) {
  if (req && (!req.url || req.url === "/")) req.url = "/api/student/telegram-auth/poll-status";
  return await handler(req, res);
}
