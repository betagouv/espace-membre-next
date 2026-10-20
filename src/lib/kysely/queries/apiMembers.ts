import { Kysely } from "kysely";

import { DB } from "@/@types/db";
import { applyMemberPerimeter } from "@/lib/api/perimeter";
import { db as database } from "@/lib/kysely";
import { ApiPerimeter } from "@/models/api/perimeter";

import { withMemberMissions } from "./users";

/**
 * Base immuable de la collection de membres : perimetre seul, sans colonnes,
 * sans tri, sans fenetre. count et list la consomment, donc le total porte sur
 * exactement le meme ensemble que la page.
 */
export function apiMembersBase(
  perimeter: ApiPerimeter,
  db: Kysely<DB> = database,
) {
  return applyMemberPerimeter(db.selectFrom("users"), perimeter);
}

export async function countApiMembers(
  perimeter: ApiPerimeter,
  db?: Kysely<DB>,
) {
  // pg rend le bigint de countAll en chaine.
  const { count } = await apiMembersBase(perimeter, db)
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .executeTakeFirstOrThrow();
  return Number(count);
}

export function listApiMembers(
  perimeter: ApiPerimeter,
  window: { limit: number; offset: number },
  db?: Kysely<DB>,
) {
  return apiMembersBase(perimeter, db)
    .select([
      "users.uuid",
      "users.username",
      "users.fullname",
      "users.github",
      "users.primary_email",
      "users.secondary_email",
    ])
    // Missions completes : le perimetre filtre des LIGNES, jamais des colonnes.
    .select((eb) => [withMemberMissions(eb)])
    .orderBy("users.fullname", "asc")
    .orderBy("users.uuid", "asc")
    .limit(window.limit)
    .offset(window.offset)
    .execute();
}
