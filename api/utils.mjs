import { CosmosClient } from "@azure/cosmos";

export function decodeClientPrincipal(req){
  const header = req.headers["x-ms-client-principal"];
  if (!header) return null;
  try{
    const decoded = Buffer.from(header, 'base64').toString('utf8');
    const p = JSON.parse(decoded);
    // Expected fields: userId, userDetails, identityProvider
    return { userId: p.userId || null, userDetails: p.userDetails || null, identityProvider: p.identityProvider || null };
  }catch(e){ return null; }
}

export function getCosmos(){
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  const db = process.env.COSMOS_DB_NAME || "tiktoklite";
  if(!endpoint || !key) throw new Error("COSMOS_ENDPOINT and COSMOS_KEY must be set.");
  const client = new CosmosClient({ endpoint, key });
  return {
    client, db,
    videos: client.database(db).container(process.env.COSMOS_CONTAINER_VIDEOS || "videos"),
    comments: client.database(db).container(process.env.COSMOS_CONTAINER_COMMENTS || "comments"),
    users: client.database(db).container(process.env.COSMOS_CONTAINER_USERS || "users"),
    ratings: client.database(db).container(process.env.COSMOS_CONTAINER_RATINGS || "ratings")
  };
}
