// Types et libellés de la fusion de fiches, sans dépendance serveur : le
// formulaire d'administration (côté navigateur) les importe.

export type MemberMergeCounts = {
  missions: number;
  teams: number;
  userEvents: number;
  dinumEmails: number;
  matrixAccount: number;
  apiKeys: number;
  serviceAccounts: number;
  startupContacts: number;
  startupFiles: number;
  formations: number;
  badgeRequests: number;
  events: number;
};

export type MemberMergeSide = {
  uuid: string;
  username: string;
  fullname: string;
  primary_email: string | null;
  secondary_email: string | null;
  /** Fin de la dernière mission, avant fusion : aide à reconnaître la fiche active. */
  last_mission_end: Date | null;
};

export type MemberMergeResult = {
  keep: MemberMergeSide;
  absorbed: MemberMergeSide;
  counts: MemberMergeCounts;
};

export const MEMBER_MERGE_LABELS: Record<keyof MemberMergeCounts, string> = {
  missions: "Missions",
  teams: "Équipes",
  userEvents: "Étapes de checklist",
  dinumEmails: "Adresses DINUM rattachées",
  matrixAccount: "Compte Tchap",
  apiKeys: "Clefs d'API",
  serviceAccounts: "Comptes de service (Sentry, Matomo…)",
  startupContacts: "Contacts incubateur / DINUM de produits",
  startupFiles: "Documents produit déposés ou supprimés",
  formations: "Inscriptions aux formations",
  badgeRequests: "Demandes de badge",
  events: "Lignes d'historique",
};
