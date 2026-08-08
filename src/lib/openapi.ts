import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { incubatorApiResponseSchema } from "@/models/incubator";
import {
  incubatorMemberSchema,
  memberDetailApiResponseSchema,
  protectedMemberSchema,
} from "@/models/member";
import {
  incubatorStartupApiResponseSchema,
  startupApiResponseSchema,
  startupWithIncubatorApiResponseSchema,
} from "@/models/startup";

// La patch de zod (ajout de .openapi) est confinee a ce module : les modeles
// restent independants de zod-to-openapi, ce qui rend ce fichier retirable sans
// toucher au reste de l'API.
extendZodWithOpenApi(z);

const errorSchema = z.object({ error: z.unknown() });

// On construit un registre neuf a chaque appel pour eviter tout etat partage.
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  registry.registerComponent("securitySchemes", "ApiKeyAuth", {
    type: "apiKey",
    in: "header",
    name: "X-Api-Key",
  });

  const Incubator = registry.register("Incubator", incubatorApiResponseSchema);
  const Startup = registry.register("Startup", startupApiResponseSchema);
  const StartupWithIncubator = registry.register(
    "StartupWithIncubator",
    startupWithIncubatorApiResponseSchema,
  );
  const IncubatorStartup = registry.register(
    "IncubatorStartup",
    incubatorStartupApiResponseSchema,
  );
  const ProtectedMember = registry.register(
    "ProtectedMember",
    protectedMemberSchema,
  );
  const IncubatorMember = registry.register(
    "IncubatorMember",
    incubatorMemberSchema,
  );
  const MemberDetail = registry.register(
    "MemberDetail",
    memberDetailApiResponseSchema,
  );

  const ghidParams = z.object({
    ghid: z
      .string()
      .openapi({ description: "Acronyme (ghid) de l'incubateur" }),
  });
  const startupGhidParams = z.object({
    ghid: z.string().openapi({ description: "Acronyme (ghid) de la startup" }),
  });
  const usernameParams = z.object({
    username: z.string().openapi({ description: "Identifiant du membre" }),
  });

  const jsonArray = (schema: z.ZodTypeAny) => ({
    "application/json": { schema: z.array(schema) },
  });
  const json = (schema: z.ZodTypeAny) => ({
    "application/json": { schema },
  });
  const notFound = {
    description: "Ressource introuvable",
    content: json(errorSchema),
  };

  registry.registerPath({
    method: "get",
    path: "/api/protected/incubators",
    summary: "Liste tous les incubateurs",
    responses: {
      200: {
        description: "Liste des incubateurs",
        content: jsonArray(Incubator),
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/protected/incubators/{ghid}",
    summary: "Detaille un incubateur",
    request: { params: ghidParams },
    responses: {
      200: { description: "Incubateur", content: json(Incubator) },
      404: notFound,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/protected/incubators/{ghid}/startups",
    summary: "Liste les startups d'un incubateur",
    request: { params: ghidParams },
    responses: {
      200: {
        description: "Startups de l'incubateur",
        content: jsonArray(IncubatorStartup),
      },
      404: notFound,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/protected/incubators/{ghid}/members",
    summary: "Liste les membres d'un incubateur (startups et equipes)",
    description:
      "Renvoie par defaut tous les rattaches, missions terminees comprises. Le parametre status=active ne garde que les membres actifs.",
    request: {
      params: ghidParams,
      query: z.object({
        status: z
          .literal("active")
          .optional()
          .openapi({ description: "Ne renvoyer que les membres actifs" }),
      }),
    },
    responses: {
      200: {
        description: "Membres de l'incubateur",
        content: jsonArray(IncubatorMember),
      },
      404: notFound,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/protected/startups",
    summary: "Liste toutes les startups",
    responses: {
      200: { description: "Liste des startups", content: jsonArray(Startup) },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/protected/startups/{ghid}",
    summary: "Detaille une startup",
    request: { params: startupGhidParams },
    responses: {
      200: {
        description: "Startup et son incubateur",
        content: json(StartupWithIncubator),
      },
      404: notFound,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/protected/startups/{ghid}/members",
    summary: "Liste les membres d'une startup",
    request: { params: startupGhidParams },
    responses: {
      200: {
        description: "Membres de la startup",
        content: jsonArray(ProtectedMember),
      },
      404: notFound,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/protected/members/{username}",
    summary: "Detaille un membre",
    request: { params: usernameParams },
    responses: {
      200: { description: "Fiche membre", content: json(MemberDetail) },
      404: notFound,
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "API protegee Espace Membre",
      version: "1.0.0",
      description:
        "Routes REST protegees exposant incubateurs, startups et membres. L'authentification est decrite par le schema de securite.",
    },
    security: [{ ApiKeyAuth: [] }],
  });
}
