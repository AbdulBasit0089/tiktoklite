import { getCosmos } from "../utils.mjs";
export default async function (context, req) {
  const id = context.bindingData.id;
  const { videos } = getCosmos();
  try{
    const { resource } = await videos.item(id, id).read();
    if (!resource){ context.res = { status:404, body:"Not found" }; return; }
    context.res = { headers:{'Content-Type':'application/json'}, body: JSON.stringify(resource) };
  }catch(e){
    context.res = { status:404, body:"Not found" };
  }
}
