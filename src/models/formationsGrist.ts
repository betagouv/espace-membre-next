// Définitions partagées du catalogue de formations sur Grist (doc « Formations »).
// Utilisées par le schéma zod, le formulaire et l'action serveur pour que tous
// s'accordent sur les choix et les identifiants de colonnes.

export enum FORMATION_MODALITE {
  PRESENTIEL = "Présentiel",
  DISTANCIEL = "Distanciel",
  E_LEARNING = "E-learning",
}

export const FORMATION_MODALITE_CHOICES: FORMATION_MODALITE[] = [
  FORMATION_MODALITE.PRESENTIEL,
  FORMATION_MODALITE.DISTANCIEL,
  FORMATION_MODALITE.E_LEARNING,
];

// Alignées sur les Choice de la colonne Grist Formats.Thematiques,
// elles-mêmes reprises du formulaire Airtable historique.
export const FORMATION_THEMATIQUES: string[] = [
  "Design",
  "Marketing",
  "Divers",
  "Produit",
  "Communication",
  "Tech",
  "Accessibilité",
  "Université d'été",
  // Repère les formations du parcours d'embarquement : sans elle, les journées
  // d'embarquement se rangeaient dans « Divers », où personne ne les cherche.
  "Parcours d'embarquement",
];

// Alignées sur les Choice de la colonne Grist Formats.Audience.
export const FORMATION_AUDIENCES: string[] = [
  "Tout public",
  "Nouveaux membres",
  "Dev",
  "Designer",
  "PO-PM",
  "Coach",
  "Intra",
  "Chargé·e de déploiement",
  "Chargé·e de support",
  "Autres",
];

// Durées proposées par le formulaire (reprises d'Airtable), convertie en
// heures pour la colonne numérique Grist Formats.Duree.
export const FORMATION_DUREES: { label: string; hours: number }[] = [
  { label: "30 min", hours: 0.5 },
  { label: "1h", hours: 1 },
  { label: "1h30", hours: 1.5 },
  { label: "2h", hours: 2 },
  { label: "2h30", hours: 2.5 },
  { label: "2h45", hours: 2.75 },
  { label: "Une demi-journée", hours: 4 },
  { label: "Une journée", hours: 8 },
];

export enum FORMATION_STATUT {
  // Déposée par un membre : l'équipe d'animation doit la valider.
  PROPOSEE = "Proposée",
  // Créée ou validée par l'équipe d'animation : visible au catalogue.
  VALIDEE = "Validée",
}

// Identifiants de colonnes de la table Formats.
export const GRIST_FORMATIONS_COLUMNS = {
  titre: "Titre",
  description: "Description",
  referent: "Referent",
  modalite: "Modalite",
  capacite: "Capacite",
  thematiques: "Thematiques",
  audience: "Audience",
  duree: "Duree",
  statut: "Statut",
  lienAdmin: "Lien_admin",
  lienSupport: "Lien_support",
  lienFeedback: "Lien_feedback",
  animateur: "Animateur",
  animateurTchap: "Animateur_tchap",
  image: "Image",
  emailOrganisateur: "Email_organisateur",
} as const;

// Identifiants de colonnes de la table Inscriptions.
export const GRIST_INSCRIPTIONS_COLUMNS = {
  membre: "membre",
  session: "Session",
  createdAt: "created_at",
  surListeDAttente: "Sur_liste_d_attente",
  present: "present",
  email: "Email",
  // Renseignées pour les notifications, envoyées depuis n8n : l'état d'attente
  // au moment de l'inscription permet de reconnaître un repêchage, et chaque
  // drapeau empêche un envoi de se répéter à chaque passage.
  enAttenteALInscription: "en_attente_a_l_inscription",
  mailInscriptionEnvoye: "mail_inscription_envoye",
  mailRepechageEnvoye: "mail_repechage_envoye",
  mailRappelEnvoye: "mail_rappel_envoye",
} as const;

// Identifiants de colonnes de la table Sessions, remplie quand la date de la
// formation est déjà fixée au moment de la proposition.
export const GRIST_SESSIONS_COLUMNS = {
  format: "Format",
  debut: "Debut",
  // `Fin` est une colonne formule (Debut + Duree_indicative_) : elle se calcule,
  // on écrit la durée et Grist en déduit la fin.
  dureeIndicative: "Duree_indicative_",
  animateurIce: "Animateur_ice",
  organisateur: "Organisateur",
  lienVisioAdmin: "Lien_visio_admin",
  capacite: "Capacite",
} as const;

/**
 * Rythme de répétition d'une formation.
 *
 * Grist ne connaît pas la notion de récurrence : on crée autant de sessions que
 * d'occurrences demandées. Chacune vit ensuite sa vie — sa propre capacité, ses
 * propres inscrits — ce qui permet d'en annuler ou d'en déplacer une sans
 * toucher aux autres.
 */
export enum FORMATION_FREQUENCE {
  AUCUNE = "aucune",
  SEMAINE = "semaine",
  MOIS = "mois",
}

export const FORMATION_FREQUENCE_CHOICES = [
  { value: FORMATION_FREQUENCE.AUCUNE, label: "Une seule date" },
  { value: FORMATION_FREQUENCE.SEMAINE, label: "semaine(s)" },
  { value: FORMATION_FREQUENCE.MOIS, label: "mois" },
] as const;

/**
 * Jours de la semaine, numérotés comme `Date.getDay()` : 0 vaut dimanche.
 * Listés du lundi au dimanche, l'ordre habituel d'un calendrier français.
 */
export const FORMATION_JOURS = [
  { value: "1", label: "lundi" },
  { value: "2", label: "mardi" },
  { value: "3", label: "mercredi" },
  { value: "4", label: "jeudi" },
  { value: "5", label: "vendredi" },
  { value: "6", label: "samedi" },
  { value: "0", label: "dimanche" },
] as const;

// Un an de sessions hebdomadaires : au-delà, c'est une erreur de saisie.
export const MAX_FORMATION_OCCURRENCES = 52;

// « Toutes les 12 semaines » ou « tous les 12 mois » couvre largement les
// besoins ; au-delà on ne programme plus, on planifie.
export const MAX_FORMATION_INTERVALLE = 12;

/**
 * Banque d'illustrations proposées au moment de créer une formation.
 *
 * Évite que chacun cherche une image : la plupart des formations se rangent
 * dans quelques thèmes qui ont déjà la leur.
 */
export const GRIST_IMAGES_COLUMNS = {
  nom: "Nom",
  image: "Image",
  categorie: "Categorie",
  active: "Active",
} as const;

/**
 * Annulations de dates, conservées pour prévenir les inscrit·es.
 *
 * Supprimer une date emporte ses inscriptions : sans cette trace, il ne
 * resterait aucune adresse à qui écrire. La ligne est donc écrite avant la
 * suppression, et n8n s'en sert pour envoyer le message.
 */
export const GRIST_ANNULATIONS_COLUMNS = {
  titre: "Titre",
  debut: "Debut",
  emails: "Emails",
  annuleeLe: "Annulee_le",
  annuleePar: "Annulee_par",
  mailEnvoye: "mail_envoye",
} as const;

/**
 * Événements d'agenda à retirer, en attente de traitement.
 *
 * Supprimer une date ou une inscription efface la ligne qui portait l'adresse
 * de l'événement : sans cette trace écrite avant, plus rien ne permettrait de
 * retrouver ce qu'il faut effacer dans l'agenda.
 */
export const GRIST_SUPPRESSIONS_AGENDA_COLUMNS = {
  uid: "Uid",
  contexte: "Contexte",
  creeLe: "Cree_le",
  supprime: "supprime",
} as const;

/**
 * Identifiants des événements d'agenda.
 *
 * La même règle vaut côté n8n, qui les reconstruit pour déposer les
 * invitations : les deux doivent rester d'accord, sans quoi une suppression
 * viserait un fichier inexistant.
 */
export const uidEvenementInscription = (
  sessionId: number | string,
  inscriptionId: number | string,
) => `formation-${sessionId}-inscription-${inscriptionId}@beta.gouv.fr`;

export const uidEvenementAnimation = (sessionId: number | string) =>
  `formation-${sessionId}-animation@beta.gouv.fr`;

/**
 * Événement annoncé à l'agenda de la communauté, un par date.
 *
 * Distinct des invitations nominatives : celles-ci s'adressent à une personne,
 * celui-ci annonce la séance à qui consulte l'agenda. Supprimer la date doit
 * retirer les deux.
 */
export const uidEvenementPublic = (sessionId: number | string) =>
  `formation-${sessionId}-public@beta.gouv.fr`;
