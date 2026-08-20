// One-off script: creates the "Demandes_Segur" table (and its columns) in the
// configured Grist document so the Ségur request forms (accès aux bureaux et
// salle de réunion) can write to it.
//
// Usage (once GRIST_API_KEY / GRIST_SEGUR_DOC_ID are set in .env):
//   npm run grist:setup-segur
//
// Safe to re-run: existing columns are left untouched, missing ones are added.

import config from "@/server/config";
import {
  GRIST_SEGUR_COLUMNS,
  SEGUR_ACCES_COLUMN_IDS,
  SEGUR_PERIODE_CHOICES,
  SEGUR_REUNION_COLUMN_IDS,
  SEGUR_STATUT_CHOICES,
} from "@/models/segur";

type GristColumn = {
  id: string;
  fields: {
    label: string;
    type: string;
    widgetOptions?: string;
  };
};

function choiceWidget(choices: string[]): string {
  return JSON.stringify({ choices });
}

// Catalogue de toutes les colonnes ; chaque table en prend un sous-ensemble.
const allColumns: GristColumn[] = [
  {
    id: GRIST_SEGUR_COLUMNS.date,
    fields: { label: "Date", type: "DateTime:Europe/Paris" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.prenomNom,
    fields: { label: "Prénom et Nom", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.email,
    fields: { label: "Adresse mail professionnelle", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.startupName,
    fields: { label: "Nom de la Startup", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.emailsEquipe,
    fields: { label: "Mails des autres membres", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.nbPersonnes,
    fields: { label: "Nombre de personnes", type: "Int" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.dateDebut,
    fields: { label: "Date souhaitée de venue", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.dateFin,
    fields: { label: "Date de fin de la venue", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.precisions,
    fields: { label: "Précisions", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.datesReunion,
    fields: { label: "Date(s) de la réunion", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.heureDebut,
    fields: { label: "Heure de début", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.heureFin,
    fields: { label: "Heure de fin", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.materiel,
    fields: { label: "Matériel nécessaire", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.joursRecurrents,
    fields: { label: "Jours (demande récurrente)", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.periodeRecurrente,
    fields: {
      label: "Période souhaitée",
      type: "Choice",
      widgetOptions: choiceWidget(SEGUR_PERIODE_CHOICES as unknown as string[]),
    },
  },
  {
    id: GRIST_SEGUR_COLUMNS.engagement,
    fields: { label: "Engagement à venir", type: "Bool" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.statut,
    fields: {
      label: "Statut",
      type: "Choice",
      widgetOptions: choiceWidget(SEGUR_STATUT_CHOICES as unknown as string[]),
    },
  },
  {
    id: GRIST_SEGUR_COLUMNS.mailEnvoye,
    fields: { label: "Mail de confirmation envoyé", type: "Bool" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.statutNotifie,
    fields: {
      label: "Statut notifié au demandeur",
      type: "Choice",
      widgetOptions: choiceWidget(SEGUR_STATUT_CHOICES as unknown as string[]),
    },
  },
  {
    id: GRIST_SEGUR_COLUMNS.userUuid,
    fields: { label: "User UUID", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.username,
    fields: { label: "Username", type: "Text" },
  },
];

type AuthHeaders = Record<string, string>;

async function setupTable(
  apiUrl: string,
  authHeaders: AuthHeaders,
  docId: string,
  tableId: string,
  columnIds: string[],
  existingTableIds: Set<string>,
) {
  const columns = allColumns.filter((c) => columnIds.includes(c.id));

  if (!existingTableIds.has(tableId)) {
    console.log(`Création de la table "${tableId}" dans le doc ${docId}...`);
    const createRes = await fetch(`${apiUrl}/docs/${docId}/tables`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ tables: [{ id: tableId, columns }] }),
    });
    if (!createRes.ok) {
      throw new Error(
        `Échec création table (${createRes.status}): ${await createRes.text()}`,
      );
    }
    console.log(`Table "${tableId}" créée.`);
    return;
  }

  // Même piège que pour les tables : POSTer une colonne déjà présente ne la
  // laisse pas tranquille, Grist crée un doublon suffixé (Date2, Email2...).
  // On liste donc l'existant et on n'envoie que ce qui manque vraiment.
  const existingRes = await fetch(
    `${apiUrl}/docs/${docId}/tables/${tableId}/columns`,
    { headers: authHeaders },
  );
  if (!existingRes.ok) {
    throw new Error(
      `Impossible de lister les colonnes de "${tableId}" (${existingRes.status}): ${await existingRes.text()}`,
    );
  }
  const { columns: existingColumns } = (await existingRes.json()) as {
    columns: { id: string }[];
  };
  const existingIds = new Set(existingColumns.map((c) => c.id));
  const missing = columns.filter((c) => !existingIds.has(c.id));

  if (missing.length === 0) {
    console.log(`Table "${tableId}" : colonnes déjà à jour.`);
    return;
  }

  console.log(
    `Table "${tableId}" : ajout de ${missing.map((c) => c.id).join(", ")}`,
  );
  const colRes = await fetch(
    `${apiUrl}/docs/${docId}/tables/${tableId}/columns`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ columns: missing }),
    },
  );
  if (!colRes.ok) {
    throw new Error(
      `Échec ajout colonnes sur "${tableId}" (${colRes.status}): ${await colRes.text()}`,
    );
  }
  console.log(`Table "${tableId}" : colonnes à jour.`);
}

async function main() {
  const apiUrl = (config.GRIST_API_URL || "").replace(/\/$/, "");
  const apiKey = config.GRIST_API_KEY;
  const docId = config.GRIST_SEGUR_DOC_ID;

  if (!apiKey || !docId) {
    throw new Error(
      "GRIST_API_KEY et GRIST_SEGUR_DOC_ID doivent être renseignés dans .env",
    );
  }

  const authHeaders: AuthHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Grist crée un doublon suffixé si on POST un id de table existant : on
  // regarde d'abord, on ne crée jamais à l'aveugle.
  const listRes = await fetch(`${apiUrl}/docs/${docId}/tables`, {
    headers: authHeaders,
  });
  if (!listRes.ok) {
    throw new Error(
      `Impossible de lister les tables (${listRes.status}): ${await listRes.text()}`,
    );
  }
  const { tables } = (await listRes.json()) as { tables: { id: string }[] };
  const existingTableIds = new Set(tables.map((t) => t.id));

  // Une table par type de demande.
  await setupTable(
    apiUrl,
    authHeaders,
    docId,
    config.GRIST_SEGUR_TABLE_ID,
    SEGUR_ACCES_COLUMN_IDS,
    existingTableIds,
  );
  await setupTable(
    apiUrl,
    authHeaders,
    docId,
    config.GRIST_SEGUR_REUNION_TABLE_ID,
    SEGUR_REUNION_COLUMN_IDS,
    existingTableIds,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
