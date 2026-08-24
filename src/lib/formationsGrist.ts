import { getGristRecords, GristRecordFields } from "@/lib/grist";
import { Formation } from "@/models/formation";
import {
  FORMATION_MODALITE,
  FORMATION_STATUT,
  GRIST_FORMATIONS_COLUMNS,
  GRIST_SESSIONS_COLUMNS,
} from "@/models/formationsGrist";
import config from "@/server/config";

// Les ChoiceList Grist arrivent sous la forme ["L", ...valeurs].
const choiceList = (value: unknown): string[] =>
  Array.isArray(value) ? (value.slice(1) as string[]) : [];

// Les DateTime Grist sont des secondes epoch.
const toDate = (value: unknown): Date | undefined =>
  typeof value === "number" && value ? new Date(value * 1000) : undefined;

type GristRow = { id: number; fields: GristRecordFields };

/**
 * Catalogue des formations lu depuis Grist.
 *
 * Une carte par format validé. La session à venir la plus proche fournit la
 * date et les places restantes ; un format sans session reste affiché, sans
 * date — il est au catalogue mais pas encore programmé.
 */
export async function fetchGristFormations(): Promise<Formation[]> {
  if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
    throw new Error(
      "L'intégration Grist n'est pas configurée (GRIST_API_KEY / GRIST_FORMATIONS_DOC_ID).",
    );
  }
  const docId = config.GRIST_FORMATIONS_DOC_ID;

  const [formats, sessions] = await Promise.all([
    getGristRecords(docId, config.GRIST_FORMATIONS_FORMATS_TABLE_ID, {
      [GRIST_FORMATIONS_COLUMNS.statut]: [FORMATION_STATUT.VALIDEE],
    }),
    getGristRecords(docId, config.GRIST_FORMATIONS_SESSIONS_TABLE_ID),
  ]);

  // Prochaine session à venir de chaque format, celles déjà passées ne
  // servent pas à l'inscription.
  const now = Date.now();
  const nextSessionByFormat = new Map<number, GristRow>();
  for (const session of sessions) {
    const formatId = Number(session.fields[GRIST_SESSIONS_COLUMNS.format]);
    const start = toDate(session.fields[GRIST_SESSIONS_COLUMNS.debut]);
    if (!formatId || !start || start.getTime() < now) continue;
    const current = nextSessionByFormat.get(formatId);
    const currentStart = current
      ? toDate(current.fields[GRIST_SESSIONS_COLUMNS.debut])
      : undefined;
    if (!currentStart || start < currentStart) {
      nextSessionByFormat.set(formatId, session);
    }
  }

  return formats.map((format) => {
    const f = format.fields;
    // La colonne Image ne contient que des identifiants de pièces jointes :
    // l'URL passe par la route qui les relaie avec la clé d'API.
    const [imageId] = choiceList(f[GRIST_FORMATIONS_COLUMNS.image]);
    const session = nextSessionByFormat.get(format.id);
    const s = session?.fields ?? {};
    const start = toDate(s[GRIST_SESSIONS_COLUMNS.debut]);
    const capacite = Number(
      s[GRIST_SESSIONS_COLUMNS.capacite] ??
        f[GRIST_FORMATIONS_COLUMNS.capacite] ??
        0,
    );
    const placesRestantes = s["Places_restantes"];

    return {
      // Le modèle vient d'Airtable : `airtable_id` sert d'identifiant d'URL,
      // on y met l'id de ligne Grist le temps que les deux sources coexistent.
      id: String(format.id),
      airtable_id: String(format.id),
      name: String(f[GRIST_FORMATIONS_COLUMNS.titre] ?? ""),
      description: String(f[GRIST_FORMATIONS_COLUMNS.description] ?? ""),
      created_at: new Date(),
      imageUrl: imageId ? `/api/formations/image/${imageId}` : undefined,
      is_embarquement: false,
      isELearning:
        f[GRIST_FORMATIONS_COLUMNS.modalite] === FORMATION_MODALITE.E_LEARNING,
      category: choiceList(f[GRIST_FORMATIONS_COLUMNS.thematiques]),
      audience: choiceList(f[GRIST_FORMATIONS_COLUMNS.audience]),
      animator:
        String(f[GRIST_FORMATIONS_COLUMNS.animateur] ?? "") || undefined,
      animatorEmail:
        String(f[GRIST_FORMATIONS_COLUMNS.emailOrganisateur] ?? "") ||
        undefined,
      start,
      startDate: start,
      formation_date: start,
      inscriptionLink: String(f[GRIST_FORMATIONS_COLUMNS.lienSupport] ?? ""),
      maxSeats: capacite || undefined,
      availableSeats:
        typeof placesRestantes === "number" ? placesRestantes : capacite,
    } satisfies Formation;
  });
}
