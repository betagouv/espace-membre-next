// Shared definitions for the "Demandes Ségur" form (accès aux bureaux). Used by
// the zod schema, the form UI, the server action and the Grist table-setup
// script so they all agree on choices and column ids.

import { addHours, addMonths, format, parseISO } from "date-fns";

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

// Le service qui instruit les badges a besoin de 48 h : une demande déposée
// pour le lendemain n'a pas le temps d'être traitée. En dessous de ce délai, le
// formulaire renvoie vers le contact ci-dessous plutôt que d'accepter une
// demande qui n'aboutira pas.
export const SEGUR_DELAI_MINIMUM_HEURES = 48;

// Une même demande ne couvre pas plus de trois mois : au-delà, il faut repasser
// par le formulaire, ce qui redonne au service l'occasion de revalider le
// besoin.
export const SEGUR_DUREE_MAXIMUM_MOIS = 3;

// Personne à qui écrire pour une venue à moins de 48 h : le formulaire pointe
// vers sa fiche membre, qui porte ses coordonnées à jour.
// TODO: remplacer par le username exact de la fiche membre d'Amel.
export const SEGUR_CONTACT_DELAI_COURT = {
  prenom: "Amel",
  username: "A_RENSEIGNER",
};

const FORMAT_DATE_INPUT = "yyyy-MM-dd";

/**
 * Première date de venue acceptée, délai de 48 h compris.
 *
 * Les champs du formulaire sont des `<input type="date">` : ils ne portent pas
 * d'heure, la comparaison se fait donc au jour. Ajouter 48 h à maintenant puis
 * ne garder que le jour revient au surlendemain, quelle que soit l'heure de
 * dépôt.
 */
export const premiereDateVenue = (maintenant: Date = new Date()): string =>
  format(addHours(maintenant, SEGUR_DELAI_MINIMUM_HEURES), FORMAT_DATE_INPUT);

/**
 * Dernière date de fin acceptée pour une venue commençant à `dateDebut`.
 *
 * Renvoie `null` si la date de début n'est pas exploitable : l'appelant décide
 * alors quoi signaler, plutôt que de recevoir une date inventée.
 */
export const derniereDateFin = (dateDebut: string): string | null => {
  const debut = parseISO(dateDebut);
  if (Number.isNaN(debut.getTime())) {
    return null;
  }
  return format(addMonths(debut, SEGUR_DUREE_MAXIMUM_MOIS), FORMAT_DATE_INPUT);
};

// Grist column ids for the Ségur table. Keep in sync with the setup script
// (src/scripts/setup-grist-segur-table.ts).
export const GRIST_SEGUR_COLUMNS = {
  date: "Date",
  prenomNom: "Prenom_Nom",
  email: "Email",
  startupName: "Startup",
  dateDebut: "Date_debut",
  dateFin: "Date_fin",
  joursRecurrents: "Jours_recurrents",
  periodeRecurrente: "Periode_recurrente",
  engagement: "Engagement",
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

export const SEGUR_ACCES_COLUMN_IDS: string[] = [
  GRIST_SEGUR_COLUMNS.date,
  GRIST_SEGUR_COLUMNS.prenomNom,
  GRIST_SEGUR_COLUMNS.email,
  GRIST_SEGUR_COLUMNS.startupName,
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
