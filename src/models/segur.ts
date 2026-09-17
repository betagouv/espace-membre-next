// Shared definitions for the "Demandes Ségur" form (accès aux bureaux et
// réservation de salle de réunion). Used by the zod schema, the form UI, the
// server action and the Grist table-setup script so they all agree on choices
// and column ids.

export enum SEGUR_DEMANDE_TYPE {
  ACCES = "Demande d'accès aux bureaux Ségur",
  SALLE_REUNION = "Demande de salle de réunion à Ségur",
}

export const SEGUR_DEMANDE_CHOICES: SEGUR_DEMANDE_TYPE[] = [
  SEGUR_DEMANDE_TYPE.ACCES,
  SEGUR_DEMANDE_TYPE.SALLE_REUNION,
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
  REFUSE = "Refusé",
}

export const SEGUR_STATUT_CHOICES: SEGUR_STATUT[] = [
  SEGUR_STATUT.A_TRAITER,
  SEGUR_STATUT.EN_COURS,
  SEGUR_STATUT.TRAITE,
  SEGUR_STATUT.REFUSE,
];

// Grist column ids for the Ségur table. Keep in sync with the setup script
// (src/scripts/setup-grist-segur-table.ts).
export const GRIST_SEGUR_COLUMNS = {
  date: "Date",
  prenomNom: "Prenom_Nom",
  email: "Email",
  startupName: "Startup",
  emailsEquipe: "Emails_equipe",
  nbPersonnes: "Nombre_personnes",
  // Demande d'accès.
  dateDebut: "Date_debut",
  dateFin: "Date_fin",
  joursRecurrents: "Jours_recurrents",
  periodeRecurrente: "Periode_recurrente",
  engagement: "Engagement",
  // Demande de salle de réunion.
  datesReunion: "Dates_reunion",
  heureDebut: "Heure_debut",
  heureFin: "Heure_fin",
  materiel: "Materiel",
  // Commun.
  precisions: "Precisions",
  statut: "Statut",
  // Automation: idempotency flag for the n8n confirmation-email workflow.
  mailEnvoye: "Mail_envoye",
  // Dernier statut pour lequel le demandeur a été prévenu. Le workflow n8n
  // compare cette colonne à `Statut` : elles diffèrent, il envoie et recopie.
  // Sans elle, un changement de statut renverrait le même mail à chaque passage.
  statutNotifie: "Statut_notifie",
  // Meta.
  userUuid: "User_uuid",
  username: "Username",
} as const;

// Chaque type de demande a sa propre table Grist : la table porte le type, il
// n'y a donc pas de colonne « Type_demande », et aucune colonne de l'autre type
// n'est écrite à vide.
export const SEGUR_ACCES_COLUMN_IDS: string[] = [
  GRIST_SEGUR_COLUMNS.date,
  GRIST_SEGUR_COLUMNS.prenomNom,
  GRIST_SEGUR_COLUMNS.email,
  GRIST_SEGUR_COLUMNS.startupName,
  GRIST_SEGUR_COLUMNS.emailsEquipe,
  GRIST_SEGUR_COLUMNS.nbPersonnes,
  GRIST_SEGUR_COLUMNS.dateDebut,
  GRIST_SEGUR_COLUMNS.dateFin,
  GRIST_SEGUR_COLUMNS.joursRecurrents,
  GRIST_SEGUR_COLUMNS.periodeRecurrente,
  GRIST_SEGUR_COLUMNS.engagement,
  GRIST_SEGUR_COLUMNS.precisions,
  GRIST_SEGUR_COLUMNS.statut,
  GRIST_SEGUR_COLUMNS.mailEnvoye,
  GRIST_SEGUR_COLUMNS.statutNotifie,
  GRIST_SEGUR_COLUMNS.userUuid,
  GRIST_SEGUR_COLUMNS.username,
];

export const SEGUR_REUNION_COLUMN_IDS: string[] = [
  GRIST_SEGUR_COLUMNS.date,
  GRIST_SEGUR_COLUMNS.prenomNom,
  GRIST_SEGUR_COLUMNS.email,
  GRIST_SEGUR_COLUMNS.startupName,
  GRIST_SEGUR_COLUMNS.emailsEquipe,
  GRIST_SEGUR_COLUMNS.nbPersonnes,
  GRIST_SEGUR_COLUMNS.datesReunion,
  GRIST_SEGUR_COLUMNS.heureDebut,
  GRIST_SEGUR_COLUMNS.heureFin,
  GRIST_SEGUR_COLUMNS.materiel,
  GRIST_SEGUR_COLUMNS.precisions,
  GRIST_SEGUR_COLUMNS.statut,
  GRIST_SEGUR_COLUMNS.mailEnvoye,
  GRIST_SEGUR_COLUMNS.statutNotifie,
  GRIST_SEGUR_COLUMNS.userUuid,
  GRIST_SEGUR_COLUMNS.username,
];
