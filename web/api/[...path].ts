import handler from "./index.js";

export default async function catchAllHandler(req: any, res?: any) {
  return await handler(req, res);
}
