import { getCosmos, decodeClientPrincipal } from "../utils.mjs";
import crypto from "crypto";

export default async function (context, req) {
  const method = req.method || "GET";
  const { videos } = getCosmos();

  if (method === "GET"){
    const q = (req.query.q || "").toLowerCase();
    const genre = (req.query.genre || "");
    const skip = parseInt(req.query.skip||"0",10);
    const take = Math.min(parseInt(req.query.take||"12",10), 50);

    // Simple query: read recent; in serverless demo we do a cross-partition query (fine for small workloads)
    let query = "SELECT * FROM c ORDER BY c.createdAt DESC";
    const { resources } = await videos.items.query(query, { enableCrossPartitionQuery: true, maxItemCount: take+skip }).fetchAll();
    let arr = resources || [];
    if (q) arr = arr.filter(x => (x.title||'').toLowerCase().includes(q) || (x.publisher||'').toLowerCase().includes(q));
    if (genre) arr = arr.filter(x => x.genre === genre);
    const items = arr.slice(skip, skip+take);
    context.res = { headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items }) };
    return;
  }

  if (method === "POST"){
    // Create video metadata (Creators only)
    const p = decodeClientPrincipal(req);
    if (!p?.userId){ context.res={status:401, body:"Sign in required"}; return; }
    const { users } = getCosmos();
    try{
      const { resource } = await users.item(p.userId, p.userId).read();
      const isCreator = Array.isArray(resource?.roles) && resource.roles.includes("Creator");
      if(!isCreator){ context.res={status:403, body:"Creator role required"}; return; }
    }catch{ context.res={status:403, body:"Creator role required"}; return; }

    const body = req.body || {};
    const now = Date.now();
    const id = `vid_${crypto.randomBytes(6).toString('hex')}`;
    const doc = {
      id, title: body.title || "Untitled", publisher: body.publisher || "Unknown",
      producer: body.producer || "Unknown", genre: body.genre || "Other", ageRating: body.ageRating || "PG",
      blobUrl: body.blobUrl, thumbnailUrl: body.thumbnailUrl, createdAt: now, views: 0, avgRating: 0, ratingsCount: 0
    };
    const { resource } = await videos.items.create(doc);
    context.res = { headers:{'Content-Type':'application/json'}, body: JSON.stringify(resource) };
    return;
  }

  context.res = { status:405, body:"Method not allowed" };
}
