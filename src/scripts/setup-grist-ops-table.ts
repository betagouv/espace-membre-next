/* eslint-disable no-console */
// One-off script: creates the "Demandes_OPS" table (and its columns) in the
// configured Grist document so the OPS request form can write to it.
//
// Usage (once GRIST_API_KEY / GRIST_OPS_DOC_ID are set in .env):
//   npm run grist:setup-ops
//
// Safe to re-run: if the table already exists Grist returns an error which we
// surface; columns are not modified on re-run.

import config from "@/server/config";
import {
  GRIST_OPS_COLUMNS,
  OPS_DEMANDE_CHOICES,
  OPS_STATUT_CHOICES,
} from "@/models/ops";

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
    id: GRIST_OPS_COLUMNS.date,
    // DateTime (secondes epoch) pour que Grist affiche une vraie date/heure
    // au lieu du timestamp brut.
    fields: { label: "Date", type: "DateTime:Europe/Paris" },
  },
  {
    id: GRIST_OPS_COLUMNS.tchapId,
    fields: { label: "Identifiant Tchap", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.email,
    fields: { label: "Email", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.demande,
    fields: {
      label: "Quelle est ta demande ?",
      type: "Choice",
      widgetOptions: choiceWidget(OPS_DEMANDE_CHOICES as unknown as string[]),
    },
  },
  {
    id: GRIST_OPS_COLUMNS.projet,
    fields: { label: "Projet (si pas une SE)", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.demandeLibre,
    fields: { label: "Demande (champ libre)", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.notes,
    fields: { label: "Notes", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.prenomNom,
    fields: { label: "Prénom Nom", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.statut,
    fields: {
      label: "Statut",
      type: "Choice",
      widgetOptions: choiceWidget(OPS_STATUT_CHOICES as unknown as string[]),
    },
  },
  // Structured fields consumed by the n8n Sentry / Matomo automations.
  {
    id: GRIST_OPS_COLUMNS.userUuid,
    fields: { label: "User UUID", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.username,
    fields: { label: "Username", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.startupId,
    fields: { label: "Startup ID", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.startupName,
    fields: { label: "Startup", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.teamSlug,
    fields: { label: "Team slug (Sentry)", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.siteUrl,
    fields: { label: "URL du site (Matomo)", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.siteType,
    fields: {
      label: "Type de site (Matomo)",
      type: "Choice",
      widgetOptions: choiceWidget(["website", "mobileapp"]),
    },
  },
  {
    id: GRIST_OPS_COLUMNS.siteName,
    fields: { label: "Nom du site (Matomo)", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.projetRattachement,
    fields: { label: "Projet à relier (Scalingo)", type: "Text" },
  },
  // One dedicated column per demande-specific field.
  {
    id: GRIST_OPS_COLUMNS.nomApp,
    fields: { label: "Nom de l'app (Scalingo)", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.zoneScalingo,
    fields: { label: "Zone Scalingo", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.emailCollaborateur,
    fields: { label: "Email collaborateur", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.handleOvh,
    fields: { label: "Handle OVH", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.zoneDns,
    fields: { label: "Zone DNS", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.emailAssocier,
    fields: { label: "Email à associer", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.urlSurveiller,
    fields: { label: "URL à surveiller (updown)", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.emailsNotifier,
    fields: { label: "Emails à notifier (updown)", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.nomWorkspace,
    fields: { label: "Nom du workspace (Tally)", type: "Text" },
  },
  {
    id: GRIST_OPS_COLUMNS.incubateur,
    fields: { label: "Incubateur", type: "Text" },
  },
];

async function main() {
  const apiUrl = (config.GRIST_API_URL || "").replace(/\/$/, "");
  const apiKey = config.GRIST_API_KEY;
  const docId = config.GRIST_OPS_DOC_ID;
  const tableId = config.GRIST_OPS_TABLE_ID;

  if (!apiKey || !docId) {
    throw new Error(
      "GRIST_API_KEY et GRIST_OPS_DOC_ID doivent être renseignés dans .env",
    );
  }

  const authHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Check whether the table already exists. IMPORTANT: POSTing to /tables with
  // an existing id does NOT fail — Grist silently creates a suffixed duplicate
  // (e.g. "Demandes_OPS2"). So we must look first and never blind-create.
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

  // Table already there: add only the missing columns. Grist ignores columns
  // whose id already exists, so this is safe to re-run.
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
