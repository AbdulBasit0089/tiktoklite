import { getCosmos, decodeClientPrincipal } from "../utils.mjs";
import crypto from "crypto";

export default async function (context, req) {
  const p = decodeClientPrincipal(req);
  if (!p?.userId){ context.res = { status:401, body:"Login required" }; return; }
  const id = context.bindingData.id;
  const text = (req.body && req.body.text || "").toString().trim();
  if (!text){ context.res={status:400, body:"Text required"}; return; }
  const { comments } = getCosmos();
  const doc = {
    id: `c_${crypto.randomBytes(6).toString('hex')}`,
    videoId: id,
    userId: p.userId,
    userName: p.userDetails || "User",
    text,
    createdAt: Date.now()
  };
  const { resource } = await comments.items.create(doc);
  context.res = { headers:{'Content-Type':'application/json'}, body: JSON.stringify(resource) };
}
