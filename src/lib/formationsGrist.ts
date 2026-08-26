import {
  getGristRecords,
  GristRecordFields,
  updateGristRecords,
} from "@/lib/grist";
import { Formation } from "@/models/formation";
import {
  FORMATION_MODALITE,
  FORMATION_STATUT,
  GRIST_FORMATIONS_COLUMNS,
  GRIST_INSCRIPTIONS_COLUMNS,
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
export async function fetchGristFormations({
  statuts = [FORMATION_STATUT.VALIDEE],
}: { statuts?: FORMATION_STATUT[] } = {}): Promise<Formation[]> {
  if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
    throw new Error(
      "L'intégration Grist n'est pas configurée (GRIST_API_KEY / GRIST_FORMATIONS_DOC_ID).",
    );
  }
  const docId = config.GRIST_FORMATIONS_DOC_ID;

  const [formats, sessions] = await Promise.all([
    getGristRecords(docId, config.GRIST_FORMATIONS_FORMATS_TABLE_ID, {
      [GRIST_FORMATIONS_COLUMNS.statut]: statuts,
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

  return formats.map((format) =>
    formatToFormation(format, nextSessionByFormat.get(format.id)),
  );
}

/**
 * Une formation par son identifiant de ligne Grist, pour la page de détail.
 */
export async function fetchGristFormationById(
  id: string,
  options?: { statuts?: FORMATION_STATUT[] },
): Promise<Formation | undefined> {
  const formations = await fetchGristFormations(options);
  return formations.find((formation) => formation.id === id);
}

/**
 * Formations en attente de validation, pour l'équipe d'animation.
 *
 * Elles ne sont pas au catalogue : sans cette liste, une proposition déposée
 * par un membre n'est visible nulle part dans l'application.
 */
export async function fetchGristPendingFormations(): Promise<Formation[]> {
  return fetchGristFormations({ statuts: [FORMATION_STATUT.PROPOSEE] });
}

function formatToFormation(format: GristRow, session?: GristRow): Formation {
  {
    const f = format.fields;
    // La colonne Image ne contient que des identifiants de pièces jointes :
    // l'URL passe par la route qui les relaie avec la clé d'API.
    const [imageId] = choiceList(f[GRIST_FORMATIONS_COLUMNS.image]);
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
      sessionId: session ? String(session.id) : undefined,
      animatorTchap:
        String(f[GRIST_FORMATIONS_COLUMNS.animateurTchap] ?? "") || undefined,
      statut: String(f[GRIST_FORMATIONS_COLUMNS.statut] ?? "") || undefined,
      lienAdmin:
        String(f[GRIST_FORMATIONS_COLUMNS.lienAdmin] ?? "") || undefined,
      lienSupport:
        String(f[GRIST_FORMATIONS_COLUMNS.lienSupport] ?? "") || undefined,
      lienFeedback:
        String(f[GRIST_FORMATIONS_COLUMNS.lienFeedback] ?? "") || undefined,
      gestionInscriptions:
        !!f[GRIST_FORMATIONS_COLUMNS.gestionInscriptions] || undefined,
      duree: Number(f[GRIST_FORMATIONS_COLUMNS.duree] ?? 0) || undefined,
      modalite: String(f[GRIST_FORMATIONS_COLUMNS.modalite] ?? "") || undefined,
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
  }
}

export type GristInscription = {
  sessionId: string;
  onWaitingList: boolean;
};

/**
 * Inscriptions du membre, par identifiant de session.
 *
 * La table Membres est indexée sur le ghid : un membre absent n'a simplement
 * aucune inscription.
 */
export async function fetchGristInscriptions(
  ghid: string,
): Promise<GristInscription[]> {
  if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) return [];
  const docId = config.GRIST_FORMATIONS_DOC_ID;

  const membres = await getGristRecords(
    docId,
    config.GRIST_FORMATIONS_MEMBRES_TABLE_ID,
    { ghid: [ghid] },
  );
  const membreRowId = membres[0]?.id;
  if (!membreRowId) return [];

  const inscriptions = await getGristRecords(
    docId,
    config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
    { [GRIST_INSCRIPTIONS_COLUMNS.membre]: [membreRowId] },
  );

  return inscriptions.map((inscription) => ({
    sessionId: String(inscription.fields[GRIST_INSCRIPTIONS_COLUMNS.session]),
    onWaitingList:
      !!inscription.fields[GRIST_INSCRIPTIONS_COLUMNS.surListeDAttente],
  }));
}

export type GristParticipant = {
  name: string;
  email: string;
  onWaitingList: boolean;
};

/**
 * Remet la liste d'attente d'accord avec la capacité de la session.
 *
 * La capacité peut bouger après coup : la baisser doit faire basculer les
 * dernières personnes inscrites sur la liste d'attente, la remonter doit
 * repêcher celles qui y patientent. Sans ce recalcul, le drapeau resterait
 * figé à ce qu'il valait au moment de l'inscription.
 *
 * L'ordre d'arrivée fait foi : premier·e inscrit·e, premier·e servi·e.
 *
 * @returns le nombre de places gagnées et perdues, pour l'affichage.
 */
export async function syncSessionWaitingList(
  sessionId: number,
  capacite: number | null | undefined,
): Promise<{ promoted: number; demoted: number }> {
  if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
    return { promoted: 0, demoted: 0 };
  }
  const docId = config.GRIST_FORMATIONS_DOC_ID;

  const inscriptions = await getGristRecords(
    docId,
    config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
    { [GRIST_INSCRIPTIONS_COLUMNS.session]: [sessionId] },
  );
  if (inscriptions.length === 0) return { promoted: 0, demoted: 0 };

  const changed = computeWaitingListChanges(inscriptions, capacite);
  if (changed.length === 0) return { promoted: 0, demoted: 0 };

  await updateGristRecords(
    docId,
    config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
    changed.map(({ id, shouldWait }) => ({
      id,
      fields: {
        [GRIST_INSCRIPTIONS_COLUMNS.surListeDAttente]: shouldWait,
      },
    })),
  );

  return {
    promoted: changed.filter(({ shouldWait }) => !shouldWait).length,
    demoted: changed.filter(({ shouldWait }) => shouldWait).length,
  };
}

/**
 * Inscriptions dont le drapeau « liste d'attente » ne correspond plus à la
 * capacité, avec la valeur qu'il devrait prendre.
 *
 * Séparée de l'écriture Grist pour rester testable : c'est du calcul pur.
 */
export const computeWaitingListChanges = (
  inscriptions: GristRow[],
  capacite: number | null | undefined,
): { id: number; shouldWait: boolean }[] => {
  const ordered = [...inscriptions].sort(
    (a, b) =>
      inscriptionOrder(a) - inscriptionOrder(b) ||
      // `created_at` est identique pour des inscriptions rapprochées (et pour
      // les lignes importées) : l'identifiant de ligne, croissant, tranche.
      a.id - b.id,
  );

  // Capacité absente ou nulle : pas de limite, donc pas de liste d'attente.
  const places = capacite && capacite > 0 ? capacite : ordered.length;

  return ordered
    .map((inscription, index) => ({
      id: inscription.id,
      shouldWait: index >= places,
      wasWaiting:
        !!inscription.fields[GRIST_INSCRIPTIONS_COLUMNS.surListeDAttente],
    }))
    .filter(({ shouldWait, wasWaiting }) => shouldWait !== wasWaiting)
    .map(({ id, shouldWait }) => ({ id, shouldWait }));
};

/**
 * Date d'inscription, en millisecondes, pour classer les inscriptions.
 *
 * La colonne est du texte libre et mélange deux formats : l'ISO écrit par
 * l'application et le style PostgreSQL des lignes reprises de l'existant
 * (« 2025-07-21 21:01:46+02:00 »). Une date illisible vaut zéro, donc la plus
 * ancienne : en cas de doute, personne ne perd sa place.
 */
const inscriptionOrder = (inscription: GristRow): number => {
  const raw = inscription.fields[GRIST_INSCRIPTIONS_COLUMNS.createdAt];
  if (typeof raw !== "string" || !raw) return 0;
  const parsed = Date.parse(raw.replace(" ", "T"));
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * Participants d'une session, pour l'animateur·ice et l'équipe d'animation.
 * Le nom vient de la table Membres, l'email de l'inscription.
 */
export async function fetchGristSessionParticipants(
  sessionId: string,
): Promise<GristParticipant[]> {
  if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) return [];
  const docId = config.GRIST_FORMATIONS_DOC_ID;

  const inscriptions = await getGristRecords(
    docId,
    config.GRIST_FORMATIONS_INSCRIPTIONS_TABLE_ID,
    { [GRIST_INSCRIPTIONS_COLUMNS.session]: [Number(sessionId)] },
  );
  if (inscriptions.length === 0) return [];

  // La table Membres compte plusieurs milliers de lignes : on la lit une fois
  // et on résout les références en mémoire.
  const membres = await getGristRecords(
    docId,
    config.GRIST_FORMATIONS_MEMBRES_TABLE_ID,
  );
  const nameByRowId = new Map(
    membres.map((m) => [
      m.id,
      String(m.fields["name"] ?? m.fields["ghid"] ?? ""),
    ]),
  );

  return inscriptions.map((inscription) => ({
    name:
      nameByRowId.get(
        Number(inscription.fields[GRIST_INSCRIPTIONS_COLUMNS.membre]),
      ) || "Membre inconnu",
    email: String(inscription.fields[GRIST_INSCRIPTIONS_COLUMNS.email] ?? ""),
    onWaitingList:
      !!inscription.fields[GRIST_INSCRIPTIONS_COLUMNS.surListeDAttente],
  }));
}
