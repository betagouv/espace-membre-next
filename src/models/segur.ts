// Shared definitions for the "Demande d'accès aux bureaux Ségur" form.
// Used by the zod schema, the form UI, the server action and the Grist
// table-setup script so they all agree on choices and column ids.

export enum SEGUR_SALLE_REUNION {
  OUI = "oui",
  NON = "non",
}

export const SEGUR_SALLE_REUNION_CHOICES: SEGUR_SALLE_REUNION[] = [
  SEGUR_SALLE_REUNION.OUI,
  SEGUR_SALLE_REUNION.NON,
];

// Days that can be picked for a recurring access request.
export const SEGUR_JOURS: string[] = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
];

export enum SEGUR_PERIODE {
  UN_MOIS = "sur une période de 1 mois",
  DEUX_MOIS = "sur une période de 2 mois",
  TROIS_MOIS = "sur une période de 3 mois",
}

export const SEGUR_PERIODE_CHOICES: SEGUR_PERIODE[] = [
  SEGUR_PERIODE.UN_MOIS,
  SEGUR_PERIODE.DEUX_MOIS,
  SEGUR_PERIODE.TROIS_MOIS,
];

export enum SEGUR_STATUT {
  A_TRAITER = "À traiter",
  EN_COURS = "En cours",
  TRAITE = "Traité",
}

export const SEGUR_STATUT_CHOICES: SEGUR_STATUT[] = [
  SEGUR_STATUT.A_TRAITER,
  SEGUR_STATUT.EN_COURS,
  SEGUR_STATUT.TRAITE,
];

// Grist column ids for the Ségur table. Keep in sync with the setup script
// (src/scripts/setup-grist-segur-table.ts).
export const GRIST_SEGUR_COLUMNS = {
  date: "Date",
  prenomNom: "Prenom_Nom",
  email: "Email",
  startupName: "Startup",
  emailsEquipe: "Emails_equipe",
  dateDebut: "Date_debut",
  dateFin: "Date_fin",
  precisions: "Precisions",
  salleReunion: "Salle_reunion",
  joursRecurrents: "Jours_recurrents",
  periodeRecurrente: "Periode_recurrente",
  engagement: "Engagement",
  statut: "Statut",
  // Meta.
  userUuid: "User_uuid",
  username: "Username",
} as const;
