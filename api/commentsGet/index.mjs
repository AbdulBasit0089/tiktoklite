import { getCosmos } from "../utils.mjs";
export default async function (context, req) {
  const id = context.bindingData.id;
  const { comments } = getCosmos();
  const query = {
    query: "SELECT * FROM c WHERE c.videoId = @id ORDER BY c.createdAt DESC",
    parameters: [{ name: "@id", value: id }]
  };
  const { resources } = await comments.items.query(query, { enableCrossPartitionQuery: true }).fetchAll();
  context.res = { headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: resources || [] }) };
}
