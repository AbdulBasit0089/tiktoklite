import { decodeClientPrincipal, getCosmos } from "../utils.mjs";

export default async function (context, req) {
  const p = decodeClientPrincipal(req) || {};
  let roles = [];
  try{
    if (p.userId){
      const { users } = getCosmos();
      const { resource } = await users.item(p.userId, p.userId).read();
      if (resource?.roles) roles = resource.roles;
    }
  }catch{ /* ignore if users container not ready */ }
  context.res = { headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ userId: p.userId || null, name: p.userDetails || null, provider: p.identityProvider || null, roles })
  };
}
