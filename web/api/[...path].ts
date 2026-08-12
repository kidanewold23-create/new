import handler from "./index.js";

export default async function catchAllHandler(req: Request) {
  return await handler(req);
}
