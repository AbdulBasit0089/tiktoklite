import { decodeClientPrincipal, getCosmos } from "../utils.mjs";
export default async function (context, req) {
  const p = decodeClientPrincipal(req);
  let isCreator=false;
  if (p?.userId){
    try{
      const { users } = getCosmos();
      const { resource } = await users.item(p.userId, p.userId).read();
      isCreator = Array.isArray(resource?.roles) && resource.roles.includes("Creator");
    }catch{}
  }
  context.res = { headers:{'Content-Type':'application/json'}, body: JSON.stringify({isCreator}) };
}
