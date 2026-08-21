import { db } from "@/lib/kysely";
import { ApiPerimeter } from "@/models/api/perimeter";

/** Les perimetres sont stockes en couple (kind, id), sans clef etrangere. */
export function toDbPerimeter(
  read: ApiPerimeter,
  write: ApiPerimeter | null,
) {
  return {
    read_perimeter_kind: read.kind,
    read_perimeter_id: read.kind === "global" ? null : read.uuid,
    write_perimeter_kind: write ? write.kind : null,
    write_perimeter_id: write && write.kind !== "global" ? write.uuid : null,
  };
}

/** Libelle expose : "global", "incubator/<ghid>" ou "startup/<ghid>". */
export async function perimeterLabelOf(perimeter: ApiPerimeter) {
  if (perimeter.kind === "global") return "global";
  const row =
    perimeter.kind === "incubator"
      ? await db
          .selectFrom("incubators")
          .select("incubators.ghid")
          .where("incubators.uuid", "=", perimeter.uuid)
          .executeTakeFirst()
      : await db
          .selectFrom("startups")
          .select("startups.ghid")
          .where("startups.uuid", "=", perimeter.uuid)
          .executeTakeFirst();
  // Repli sur l'uuid, jamais sur la chaine vide : un `incubator/` ne satisfait
  // pas perimeterLabelSchema, et ce libelle part dans des evenements et des
  // courriels, ou une forme non analysable ne se rattrape plus. Le cas se
  // produit quand la cible a disparu, les perimetres ne portant aucune clef
  // etrangere, et aussi a la creation d'une clef de LECTURE, dont l'uuid n'est
  // verifie par personne puisque la lecture est libre.
  return `${perimeter.kind}/${row?.ghid ?? perimeter.uuid}`;
}
