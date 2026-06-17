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
    id: GRIST_OPS_COLUMNS.adressesMail,
    fields: { label: "Adresses mail à ajouter", type: "Text" },
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
    id: GRIST_OPS_COLUMNS.jourSegur,
    fields: { label: "Jour de venue à Ségur", type: "Date" },
  },
  {
    id: GRIST_OPS_COLUMNS.utilite,
    fields: { label: "Utilité du formulaire", type: "Int" },
  },
  {
    id: GRIST_OPS_COLUMNS.statut,
    fields: {
      label: "Statut",
      type: "Choice",
      widgetOptions: choiceWidget(OPS_STATUT_CHOICES as unknown as string[]),
    },
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

  const url = `${apiUrl}/docs/${docId}/tables`;
  const body = {
    tables: [{ id: tableId, columns }],
  };

  console.log(`Création de la table "${tableId}" dans le doc ${docId}...`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Échec (${res.status}): ${text}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
