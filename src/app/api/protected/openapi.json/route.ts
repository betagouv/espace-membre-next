import { buildOpenApiDocument } from "@/lib/openapi";

// Le document est 100% statique : on le genere une fois au build plutot qu'a
// chaque requete. extendZodWithOpenApi (cf @/lib/openapi) ne tourne donc qu'au
// build, jamais dans le serveur en production.
export const dynamic = "force-static";

export const GET = async () => {
  return Response.json(buildOpenApiDocument());
};
