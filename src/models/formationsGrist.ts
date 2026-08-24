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
];

// Alignées sur les Choice de la colonne Grist Formats.Audience.
export const FORMATION_AUDIENCES: string[] = [
  "Tout public",
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
  gestionInscriptions: "Gestion_inscriptions",
  animateur: "Animateur",
  animateurTchap: "Animateur_tchap",
  image: "Image",
  emailOrganisateur: "Email_organisateur",
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
