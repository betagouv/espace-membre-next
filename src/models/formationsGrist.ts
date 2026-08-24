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

// Alignées sur les Choice de la colonne Grist Formats.Thematiques.
export const FORMATION_THEMATIQUES: string[] = [
  "Développement",
  "Sécurité informatique",
  "Intraprenariat",
  "Accessibilité",
  "Juridique",
  "Administration",
  "Déploiement",
  "Design",
  "Gestion d'équipe",
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
} as const;
