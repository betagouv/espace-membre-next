import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { MAX_LIMIT } from "@/lib/api/pagination";
import { getBaseUrl } from "@/lib/url";
import { collectionMetaSchema } from "@/models/api/envelope";
import {
  incubatorApiResponseSchema,
  incubatorPatchSchema,
  incubatorRefSchema,
} from "@/models/api/incubator";
import {
  apiMemberSchema,
  incubatorMemberSchema,
  memberDetailApiResponseSchema,
} from "@/models/api/member";
import { problemSchema } from "@/models/api/problem";
import { API_SCOPES } from "@/models/api/scope";
import {
  startupStandardsPatchSchema,
  startupStandardsResponseSchema,
  startupStandardsSchema,
} from "@/models/api/standards";
import {
  incubatorStartupApiResponseSchema,
  startupApiResponseSchema,
  startupPatchSchema,
  startupWithIncubatorApiResponseSchema,
} from "@/models/api/startup";

// extendZodWithOpenApi patche le prototype zod PARTAGE par tout le repo (ajout de
// .openapi et wrapping de .optional/.nullable/.pick/...). C'est idempotent et sans
// effet sur la validation, mais ce n'est PAS confine a ce module. On l'accepte
// parce que la route /api/v1/openapi.json est generee statiquement au build
// (dynamic = "force-static") : ce patch ne s'execute donc qu'au build, jamais dans
// le serveur en production. Les modeles n'importent pas zod-to-openapi, ce qui
// garde ce fichier + la route retirables sans toucher au reste de l'API.
extendZodWithOpenApi(z);

const PROBLEM_DESCRIPTIONS: Record<number, string> = {
  401: "Jeton absent, inconnu, revoque ou porteur expire.",
  403: "Portee insuffisante, ou ressource hors du perimetre de la clef.",
  404: "Ressource introuvable.",
  405: "Methode non autorisee sur ce chemin.",
  409: "Conflit avec l'etat courant de la ressource.",
  415: "Type de media non supporte.",
  422: "Parametres ou corps de requete invalides.",
  503: "Authentification par jeton temporairement suspendue.",
};

// On construit un registre neuf a chaque appel pour eviter tout etat partage.
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  registry.registerComponent("securitySchemes", "BearerApiKey", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "em1",
    description:
      "Clef d'API personnelle ou d'application, creee depuis l'Espace Membre. " +
      "Le jeton n'est affiche qu'une seule fois a la creation.",
  });

  const Problem = registry.register("Problem", problemSchema);
  const IncubatorRef = registry.register("IncubatorRef", incubatorRefSchema);
  const Incubator = registry.register("Incubator", incubatorApiResponseSchema);
  const IncubatorPatch = registry.register(
    "IncubatorPatch",
    incubatorPatchSchema,
  );
  const Startup = registry.register("Startup", startupApiResponseSchema);
  const StartupWithIncubators = registry.register(
    "StartupWithIncubators",
    startupWithIncubatorApiResponseSchema,
  );
  const StartupPatch = registry.register("StartupPatch", startupPatchSchema);
  const IncubatorStartup = registry.register(
    "IncubatorStartup",
    incubatorStartupApiResponseSchema,
  );
  const Member = registry.register("Member", apiMemberSchema);
  const IncubatorMember = registry.register(
    "IncubatorMember",
    incubatorMemberSchema,
  );
  const MemberDetail = registry.register(
    "MemberDetail",
    memberDetailApiResponseSchema,
  );
  const StartupStandards = registry.register(
    "StartupStandards",
    startupStandardsSchema,
  );
  const StartupStandardsPatch = registry.register(
    "StartupStandardsPatch",
    startupStandardsPatchSchema,
  );
  const StartupStandardsResponse = registry.register(
    "StartupStandardsResponse",
    startupStandardsResponseSchema,
  );
  // IncubatorRef est reference par les schemas embarques ; l'enregistrer
  // explicitement garde le document lisible.
  void IncubatorRef;

  const problemContent = { "application/problem+json": { schema: Problem } };

  // 405 fait partie du socle : chaque route.ts exporte des methodNotAllowed pour
  // les verbes plausibles, donc un chemin documente repond bien 405 en
  // problem+json.
  const errors = (...codes: number[]) =>
    Object.fromEntries(
      [401, 403, 405, 422, 503, ...codes]
        .filter((code, i, all) => all.indexOf(code) === i)
        .sort()
        .map((code) => [
          String(code),
          { description: PROBLEM_DESCRIPTIONS[code], content: problemContent },
        ]),
    );

  // Un seul parametre de composant : type string avec pattern couvrant les deux
  // formes. Un anyOf de deux string decrirait la meme chose mais ferait produire
  // aux generateurs de clients une union inutilisable.
  const resourceIdParam = registry.registerParameter(
    "ResourceId",
    z
      .string()
      .regex(
        /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|[A-Za-z0-9._-]+)$/,
      )
      .openapi({
        param: { name: "id", in: "path" },
        description:
          "Identifiant de la ressource : uuid ou ghid. Le motif uuid est teste EN PREMIER, " +
          "un identifiant qui a la forme d'un uuid est toujours lu comme un uuid.",
        examples: ["incubateur-de-services-numeriques", "b3f0c1e2-1a2b-4c3d-8e9f-0a1b2c3d4e5f"],
      }),
  );

  const idParams = z.object({ id: resourceIdParam });

  const paginationQuery = z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_LIMIT)
      .optional()
      .openapi({ description: `Taille de page, 50 par defaut, ${MAX_LIMIT} au maximum.` }),
    offset: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .openapi({ description: "Decalage, 0 par defaut." }),
  });

  const phaseQuery = z.object({
    phase: z.string().optional().openapi({
      description:
        "Filtre sur la phase courante, valeurs separees par des virgules (ex: construction,acceleration). Aucun filtre par defaut.",
    }),
  });

  const item = (schema: z.ZodTypeAny) => ({
    "application/json": { schema: z.object({ data: schema }) },
  });
  const collection = (schema: z.ZodTypeAny) => ({
    "application/json": {
      schema: z.object({ data: z.array(schema), meta: collectionMetaSchema }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/incubators",
    operationId: "listIncubators",
    tags: ["Incubateurs"],
    summary: "Liste les incubateurs du perimetre de la clef",
    "x-required-scopes": ["incubators:read"],
    request: { query: paginationQuery },
    responses: {
      200: {
        description: "Liste des incubateurs",
        content: collection(Incubator),
      },
      ...errors(),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/incubators/{id}",
    operationId: "getIncubator",
    tags: ["Incubateurs"],
    summary: "Detaille un incubateur",
    "x-required-scopes": ["incubators:read"],
    request: { params: idParams },
    responses: {
      200: { description: "Incubateur", content: item(Incubator) },
      ...errors(404),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/incubators/{id}",
    operationId: "patchIncubator",
    tags: ["Incubateurs"],
    summary: "Met a jour les champs descriptifs d'un incubateur",
    description:
      "Merge patch RFC 7396. highlighted_startups est exprime en ghid. Le ghid de " +
      "l'incubateur lui-meme n'est pas exposable en ecriture. Repond 204 sans corps " +
      "si la clef ne porte pas incubators:read.",
    "x-required-scopes": ["incubators:write"],
    request: {
      params: idParams,
      body: {
        content: { "application/merge-patch+json": { schema: IncubatorPatch } },
      },
    },
    responses: {
      200: { description: "Incubateur mis a jour", content: item(Incubator) },
      204: { description: "Ecriture acceptee, sans representation" },
      ...errors(404, 409, 415),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/incubators/{id}/startups",
    operationId: "listIncubatorStartups",
    tags: ["Incubateurs", "Produits"],
    summary: "Liste les produits d'un incubateur",
    "x-required-scopes": ["startups:read"],
    request: {
      params: idParams,
      query: paginationQuery.merge(phaseQuery),
    },
    responses: {
      200: {
        description: "Produits de l'incubateur",
        content: collection(IncubatorStartup),
      },
      ...errors(404),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/incubators/{id}/members",
    operationId: "listIncubatorMembers",
    tags: ["Incubateurs", "Membres"],
    summary: "Liste les membres d'un incubateur (produits et equipes)",
    description:
      "Renvoie par defaut tous les rattaches, missions terminees comprises. Le parametre status=active ne garde que les membres actifs. Le perimetre de la clef s'applique EN PLUS du filtre de chemin : une clef de perimetre startup/S atteint les incubateurs de S, mais n'y enumere que les membres de S.",
    "x-required-scopes": ["members:read"],
    request: {
      params: idParams,
      query: paginationQuery.merge(
        z.object({
          status: z
            .literal("active")
            .optional()
            .openapi({ description: "Ne renvoyer que les membres actifs" }),
        }),
      ),
    },
    responses: {
      200: {
        description: "Membres de l'incubateur",
        content: collection(IncubatorMember),
      },
      ...errors(404),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/startups",
    operationId: "listStartups",
    tags: ["Produits"],
    summary: "Liste les produits du perimetre de la clef",
    "x-required-scopes": ["startups:read"],
    request: { query: paginationQuery.merge(phaseQuery) },
    responses: {
      200: { description: "Liste des produits", content: collection(Startup) },
      ...errors(),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/startups/{id}",
    operationId: "getStartup",
    tags: ["Produits"],
    summary: "Detaille un produit",
    description:
      "incubators porte TOUS les incubateurs lies, y compris hors du perimetre de la clef : " +
      "le perimetre filtre des lignes, jamais des colonnes.",
    "x-required-scopes": ["startups:read"],
    request: { params: idParams },
    responses: {
      200: {
        description: "Produit et ses incubateurs",
        content: item(StartupWithIncubators),
      },
      ...errors(404),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/startups/{id}",
    operationId: "patchStartup",
    tags: ["Produits"],
    summary: "Met a jour les champs descriptifs d'un produit",
    description:
      "Merge patch RFC 7396. Repond 204 sans corps si la clef ne porte pas startups:read.",
    "x-required-scopes": ["startups:write"],
    request: {
      params: idParams,
      body: {
        content: { "application/merge-patch+json": { schema: StartupPatch } },
      },
    },
    responses: {
      200: {
        description: "Produit mis a jour",
        content: item(StartupWithIncubators),
      },
      204: { description: "Ecriture acceptee, sans representation" },
      ...errors(404, 409, 415),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/v1/startups/{id}/standards",
    operationId: "replaceStartupStandards",
    tags: ["Produits"],
    summary: "Remplace les standards d'un produit",
    description:
      "Remplacement complet : tout champ absent est remis a null. Repond 204 sans corps " +
      "si la clef ne porte pas startups:read.",
    "x-required-scopes": ["startups:write"],
    request: {
      params: idParams,
      body: { content: { "application/json": { schema: StartupStandards } } },
    },
    responses: {
      200: {
        description: "Standards du produit",
        content: item(StartupStandardsResponse),
      },
      204: { description: "Ecriture acceptee, sans representation" },
      ...errors(404, 409, 415),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/startups/{id}/standards",
    operationId: "patchStartupStandards",
    tags: ["Produits"],
    summary: "Met a jour partiellement les standards d'un produit",
    description:
      "Merge patch RFC 7396 : seuls les champs presents sont ecrits, null efface.",
    "x-required-scopes": ["startups:write"],
    request: {
      params: idParams,
      body: {
        content: {
          "application/merge-patch+json": { schema: StartupStandardsPatch },
        },
      },
    },
    responses: {
      200: {
        description: "Standards du produit",
        content: item(StartupStandardsResponse),
      },
      204: { description: "Ecriture acceptee, sans representation" },
      ...errors(404, 409, 415),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/startups/{id}/members",
    operationId: "listStartupMembers",
    tags: ["Produits", "Membres"],
    summary: "Liste les membres d'un produit",
    "x-required-scopes": ["members:read"],
    request: { params: idParams, query: paginationQuery },
    responses: {
      200: {
        description: "Membres du produit",
        content: collection(Member),
      },
      ...errors(404),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/members",
    operationId: "listMembers",
    tags: ["Membres"],
    summary: "Liste les membres du perimetre de la clef",
    "x-required-scopes": ["members:read"],
    request: { query: paginationQuery },
    responses: {
      200: { description: "Liste des membres", content: collection(Member) },
      ...errors(),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/members/{id}",
    operationId: "getMember",
    tags: ["Membres"],
    summary: "Detaille un membre",
    "x-required-scopes": ["members:read"],
    request: { params: idParams },
    responses: {
      200: { description: "Fiche membre", content: item(MemberDetail) },
      ...errors(404),
    },
  });

  // Les deux operations publiques ne portent que leur 200 et le 405 : ni 401,
  // ni 403, ni 422, ni 503 ne peuvent en sortir.
  const publicErrors = {
    405: { description: PROBLEM_DESCRIPTIONS[405], content: problemContent },
  };

  registry.registerPath({
    method: "get",
    path: "/api/v1/openapi.json",
    operationId: "getOpenApiDocument",
    tags: ["Meta"],
    summary: "Document OpenAPI de cette API",
    security: [],
    responses: {
      200: {
        description: "Document OpenAPI 3.1",
        content: { "application/json": { schema: z.object({}).passthrough() } },
      },
      ...publicErrors,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/docs",
    operationId: "getApiDocs",
    tags: ["Meta"],
    summary: "Page de documentation interactive",
    security: [],
    responses: {
      200: {
        description: "Page HTML",
        content: { "text/html": { schema: z.string() } },
      },
      ...publicErrors,
    },
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "API Espace Membre",
      version: "1.0.0",
      description: [
        "Routes REST exposant incubateurs, produits et membres.",
        "",
        "Invariants du contrat :",
        "- toute reponse est enveloppee, `{ data }` sur l'unitaire, `{ data, meta }` sur une collection ;",
        "- les erreurs suivent la RFC 9457 (`application/problem+json`) ;",
        "- chaque operation declare ses portees dans `x-required-scopes` ;",
        "- aucune implication entre portees : une ecriture repond 204 sans la portee de lecture correspondante, 200 avec ;",
        "- un identifiant en forme d'uuid est toujours lu comme un uuid, jamais comme un ghid ;",
        "- une collection ne repond jamais 403, une ressource unitaire hors perimetre repond 403 et non 404 ;",
        `- portees disponibles : ${API_SCOPES.join(", ")}.`,
      ].join("\n"),
    },
    servers: [{ url: getBaseUrl(), description: "Instance courante" }],
    security: [{ BearerApiKey: [] }],
    tags: [
      { name: "Incubateurs" },
      { name: "Produits" },
      { name: "Membres" },
      { name: "Meta" },
    ],
  });
}
