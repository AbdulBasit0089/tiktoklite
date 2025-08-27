import { decodeClientPrincipal, getCosmos } from "../utils.mjs";
import { BlobSASPermissions, generateBlobSASQueryParameters, SASProtocol, StorageSharedKeyCredential } from "@azure/storage-blob";
import crypto from "crypto";

function guid(){ return crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.randomBytes(1)[0]&15>>c/4).toString(16)); }

export default async function (context, req) {
  const p = decodeClientPrincipal(req);
  if (!p?.userId){ context.res={status:401, body:"Sign in required"}; return; }
  // Check Creator role
  try{
    const { users } = getCosmos();
    const { resource } = await users.item(p.userId, p.userId).read();
    const isCreator = Array.isArray(resource?.roles) && resource.roles.includes("Creator");
    if(!isCreator){ context.res={status:403, body:"Creator role required"}; return; }
  }catch{ context.res={status:403, body:"Creator role required"}; return; }

  const accountName = process.env.STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.STORAGE_ACCOUNT_KEY;
  const container = process.env.STORAGE_CONTAINER || "videos";
  if(!accountName || !accountKey){ context.res={status:500, body:"Storage not configured"}; return; }

  const fileName = (req.body && req.body.fileName) || `${guid()}.mp4`;
  const blobName = `videos/${guid()}-${fileName.replace(/[^\w\-.]+/g,'_')}`;

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + 15*60*1000); // 15 minutes
  const sas = generateBlobSASQueryParameters({
    containerName: container,
    blobName,
    permissions: BlobSASPermissions.parse("cw"), // create+write
    protocol: SASProtocol.Https,
    startsOn: new Date(Date.now() - 60*1000),
    expiresOn
  }, sharedKeyCredential).toString();

  const blobUrl = `https://${accountName}.blob.core.windows.net/${container}/${blobName}`;
  const uploadUrl = `${blobUrl}?${sas}`;

  context.res = { headers:{'Content-Type':'application/json'}, body: JSON.stringify({ uploadUrl, blobUrl, expiresOn }) };
}
