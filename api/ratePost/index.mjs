import { getCosmos, decodeClientPrincipal } from "../utils.mjs";
import crypto from "crypto";

export default async function (context, req) {
  const p = decodeClientPrincipal(req);
  if (!p?.userId){ context.res={status:401, body:"Login required"}; return; }
  const id = context.bindingData.id;
  let stars = Number((req.body && req.body.stars) || 0);
  if (!(stars>=1 && stars<=5)){ context.res={status:400, body:"Stars 1-5"}; return; }

  const { ratings, videos } = getCosmos();
  const ratingId = `r_${p.userId}_${id}`;
  // Upsert rating
  await ratings.items.upsert({ id: ratingId, videoId:id, userId:p.userId, stars, createdAt: Date.now() });

  // Recompute average (simple approach for demo: query all ratings for the video)
  const query = { query: "SELECT VALUE c.stars FROM c WHERE c.videoId=@id", parameters:[{name:"@id", value:id}] };
  const { resources } = await ratings.items.query(query, { enableCrossPartitionQuery: true }).fetchAll();
  const list = resources || [];
  const count = list.length || 1;
  const avg = list.reduce((a,b)=>a+Number(b||0),0) / count;

  // Update video doc
  try{
    const { resource: v } = await videos.item(id, id).read();
    if (v){
      v.avgRating = Math.round(avg*10)/10;
      v.ratingsCount = count;
      await videos.items.upsert(v);
    }
  }catch{}

  context.res = { headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:true, avg: Math.round(avg*10)/10, count }) };
}
