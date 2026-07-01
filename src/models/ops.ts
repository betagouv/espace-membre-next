// Shared definitions for the "Demandes d'OPS" form.
// Used by the zod schema, the form UI, the server action and the Grist
// table-setup script so they all agree on choices and column ids.

export enum OPS_DEMANDE_TYPE {
  SCALINGO_APP = "Création d'app Scalingo",
  CLOUD_RESOURCES = "Ressources Clever cloud, OVH, scaleway",
  DNS_DOMAIN = "Création/délégation de domaine/zone DNS (OVH)",
  DNS_RECORD = "Ajouter un record sur mon domaine OVH (CNAME, A, ...)",
  BREVO = "Ajout d'un compte Brevo",
  UPDOWN = "Ajout d'un site sur updown.io",
  SSL_CERTIGNA = "Demande de certificat SSL Certigna",
  MAILING_LIST = "Création d'une mailing list @beta.gouv.fr",
  TALLY = "Création d'un compte tally",
  AUTRE = "Autre",
}

// Order shown in the form (matches the airtable form).
export const OPS_DEMANDE_CHOICES: OPS_DEMANDE_TYPE[] = [
  OPS_DEMANDE_TYPE.SCALINGO_APP,
  OPS_DEMANDE_TYPE.CLOUD_RESOURCES,
  OPS_DEMANDE_TYPE.DNS_DOMAIN,
  OPS_DEMANDE_TYPE.DNS_RECORD,
  OPS_DEMANDE_TYPE.BREVO,
  OPS_DEMANDE_TYPE.UPDOWN,
  OPS_DEMANDE_TYPE.TALLY,
  OPS_DEMANDE_TYPE.AUTRE,
];

// Per-demande conditional fields. Keys map to the zod schema and form inputs.
export interface OpsField {
  key: string;
  label: string;
  hint?: string;
  type?: "text" | "email" | "textarea" | "select";
  // Options for the "select" type (rendered as radio buttons).
  options?: string[];
  // Default-checked option for the "select" type.
  defaultValue?: string;
  required?: boolean;
}

export type OpsFieldKey =
  | "nomApp"
  | "zoneScalingo"
  | "emailCollaborateur"
  | "handleOvh"
  | "zoneDns"
  | "urlSite"
  | "emailAssocier"
  | "urlSurveiller"
  | "emailsNotifier"
  | "commentaires";

export const OPS_FIELDS: Record<OpsFieldKey, OpsField> = {
  nomApp: { key: "nomApp", label: "Nom de l'app à créer", required: true },
  zoneScalingo: {
    key: "zoneScalingo",
    label: "Zone Scalingo",
    hint: "osc-secnum-fr1 est recommandé (zone SecNumCloud, plus sécurisée). Choisis osc-fr1 uniquement si tu es en dev/preprod et n'exploite pas de données sensibles.",
    type: "select",
    options: ["osc-secnum-fr1", "osc-fr1"],
    defaultValue: "osc-secnum-fr1",
    required: true,
  },
  emailCollaborateur: {
    key: "emailCollaborateur",
    label: "Email à indiquer en collaborateur",
    type: "email",
    required: true,
  },
  handleOvh: {
    key: "handleOvh",
    label: "Handle OVH à qui déléguer",
    hint: "ex: xy4234234-ovh",
    required: true,
  },
  zoneDns: {
    key: "zoneDns",
    label: "Zone DNS à créer",
    hint: "ex: startup.beta.gouv.fr",
    required: true,
  },
  urlSite: { key: "urlSite", label: "URL du site", required: true },
  emailAssocier: {
    key: "emailAssocier",
    label: "Email à associer",
    type: "email",
    required: true,
  },
  urlSurveiller: {
    key: "urlSurveiller",
    label: "URL à surveiller",
    required: true,
  },
  emailsNotifier: {
    key: "emailsNotifier",
    label: "Emails à notifier",
    type: "textarea",
    required: true,
  },
  commentaires: {
    key: "commentaires",
    label: "Commentaires",
    type: "textarea",
    required: false,
  },
};

// Which fields to show (and require) per demande type.
export const OPS_DEMANDE_FIELDS: Record<OPS_DEMANDE_TYPE, OpsFieldKey[]> = {
  [OPS_DEMANDE_TYPE.SCALINGO_APP]: [
    "nomApp",
    "zoneScalingo",
    "emailCollaborateur",
    "commentaires",
  ],
  [OPS_DEMANDE_TYPE.CLOUD_RESOURCES]: ["commentaires"],
  [OPS_DEMANDE_TYPE.DNS_DOMAIN]: ["handleOvh", "zoneDns", "commentaires"],
  [OPS_DEMANDE_TYPE.DNS_RECORD]: ["commentaires"],
  [OPS_DEMANDE_TYPE.BREVO]: ["emailAssocier", "commentaires"],
  [OPS_DEMANDE_TYPE.UPDOWN]: [
    "urlSurveiller",
    "emailsNotifier",
    "commentaires",
  ],
  [OPS_DEMANDE_TYPE.TALLY]: ["commentaires"],
  [OPS_DEMANDE_TYPE.SSL_CERTIGNA]: ["commentaires"],
  [OPS_DEMANDE_TYPE.MAILING_LIST]: ["commentaires"],
  [OPS_DEMANDE_TYPE.AUTRE]: ["commentaires"],
};

// Demandes where the free-form "commentaires" is mandatory (it is the only
// meaningful input for them).
export const OPS_DEMANDE_COMMENT_REQUIRED: OPS_DEMANDE_TYPE[] = [
  OPS_DEMANDE_TYPE.CLOUD_RESOURCES,
  OPS_DEMANDE_TYPE.DNS_RECORD,
  OPS_DEMANDE_TYPE.TALLY,
];

export enum OPS_STATUT {
  A_TRAITER = "À traiter",
  EN_COURS = "En cours",
  TRAITE = "Traité",
}

export const OPS_STATUT_CHOICES: OPS_STATUT[] = [
  OPS_STATUT.A_TRAITER,
  OPS_STATUT.EN_COURS,
  OPS_STATUT.TRAITE,
];

// Grist column ids for the OPS table. Keep in sync with the setup script
// (src/scripts/setup-grist-ops-table.ts).
export const GRIST_OPS_COLUMNS = {
  date: "Date",
  tchapId: "Tchap",
  email: "Email",
  demande: "Demande",
  projet: "Projet",
  demandeLibre: "Demande_libre",
  notes: "Notes",
  prenomNom: "Prenom_Nom",
  statut: "Statut",
} as const;
