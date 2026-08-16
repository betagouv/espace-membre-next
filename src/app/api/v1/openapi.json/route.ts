import { publicApiV1 } from "@/lib/api/withApiV1";
import { buildOpenApiDocument } from "@/lib/openapi";

// Le document est 100% statique : on le genere une fois au build plutot qu'a
// chaque requete. extendZodWithOpenApi (cf @/lib/openapi) ne tourne donc qu'au
// build, jamais dans le serveur en production.
export const dynamic = "force-static";

// Une spec n'est pas enveloppee : c'est un document normalise, l'envelopper la
// rendrait illisible par tout outil standard.
export const GET = publicApiV1(async () =>
  Response.json(buildOpenApiDocument()),
);
