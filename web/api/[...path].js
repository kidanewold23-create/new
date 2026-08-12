import handler from "./index.js";

export default async function catchAllHandler(req) {
  return await handler(req);
}
