// One-off script: creates the "Demandes_Segur" table (and its columns) in the
// configured Grist document so the Ségur access request form can write to it.
//
// Usage (once GRIST_API_KEY / GRIST_SEGUR_DOC_ID are set in .env):
//   npm run grist:setup-segur
//
// Safe to re-run: existing columns are left untouched, missing ones are added.

import config from "@/server/config";
import {
  GRIST_SEGUR_COLUMNS,
  SEGUR_PERIODE_CHOICES,
  SEGUR_SALLE_REUNION_CHOICES,
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

const columns: GristColumn[] = [
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
    id: GRIST_SEGUR_COLUMNS.salleReunion,
    fields: {
      label: "Demande de salle de réunion",
      type: "Choice",
      widgetOptions: choiceWidget(
        SEGUR_SALLE_REUNION_CHOICES as unknown as string[],
      ),
    },
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
    id: GRIST_SEGUR_COLUMNS.userUuid,
    fields: { label: "User UUID", type: "Text" },
  },
  {
    id: GRIST_SEGUR_COLUMNS.username,
    fields: { label: "Username", type: "Text" },
  },
];

async function main() {
  const apiUrl = (config.GRIST_API_URL || "").replace(/\/$/, "");
  const apiKey = config.GRIST_API_KEY;
  const docId = config.GRIST_SEGUR_DOC_ID;
  const tableId = config.GRIST_SEGUR_TABLE_ID;

  if (!apiKey || !docId) {
    throw new Error(
      "GRIST_API_KEY et GRIST_SEGUR_DOC_ID doivent être renseignés dans .env",
    );
  }

  const authHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Grist silently creates a suffixed duplicate if we POST an existing table id,
  // so we must look first and never blind-create.
  const listRes = await fetch(`${apiUrl}/docs/${docId}/tables`, {
    headers: authHeaders,
  });
  if (!listRes.ok) {
    throw new Error(
      `Impossible de lister les tables (${listRes.status}): ${await listRes.text()}`,
    );
  }
  const { tables } = (await listRes.json()) as { tables: { id: string }[] };
  const tableExists = tables.some((t) => t.id === tableId);

  if (!tableExists) {
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
    console.log("Table créée.");
    return;
  }

  console.log(
    `Table "${tableId}" existante — ajout des colonnes manquantes...`,
  );
  const colRes = await fetch(
    `${apiUrl}/docs/${docId}/tables/${tableId}/columns`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ columns }),
    },
  );
  if (!colRes.ok) {
    throw new Error(
      `Échec ajout colonnes (${colRes.status}): ${await colRes.text()}`,
    );
  }
  console.log("Colonnes à jour.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
