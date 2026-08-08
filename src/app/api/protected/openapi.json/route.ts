import { buildOpenApiDocument } from "@/lib/openapi";

export const GET = async () => {
  return Response.json(buildOpenApiDocument());
};
