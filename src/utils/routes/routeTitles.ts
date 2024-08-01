import { localizedRoutes } from "./localizedRoutes";

export const routeTitles: {
    [routeName in keyof typeof localizedRoutes]:
        | (() => string)
        | ((id?: string) => string);
} = {
    account: () => "Compte",
    accountEditBaseInfo: () => "Mise à jour de mes informations",
    accountEditPrivateInfo: () => "Mise à jour de mes informations privées",
    accountBadge: () => "Demande de badge",
    accountBadgeRenewal: () => "Renouvellement de badge",
    community: () => "Rechercher un ou une membre",
    communityCreateMember: () => "Créer une fiche membre",
    dashboard: () => "Accueil",
    startupList: () => "Rechercher un produit",
    startupDetails: () => "",
    startupDetailsEdit: (id?: string) => {
        return `Modifier la fiche produit de ${id}`;
    },
    startupCreate: () => "Créer une fiche produit",
    organizationList: () => "Rechercher une organisation sponsor",
    organizationDetails: () => "",
    organizationDetailsEdit: (id?: string) => {
        return `Modifier la fiche de ${id}`;
    },
    organizationCreate: () => "Créer une fiche organisation sponsor",
    adminMattermost: () => "Administration mattermost",
    home: () => "",
    signIn: () => "Me connecter",
    login: () => "Me connecter",
    onboarding: () => "Créer une fiche membre",
    onboardingSuccess: () => "Fiche membre créée",
    newsletters: () => "Infolettre",
    map: () => "Carte des membres",
    metabase: () => "Dataviz des membres",
    keskispasse: () => "Qu'est-ce qui se passe ?",
    eventsList: () => "Événements à venir",
    formationList: () => "Catalogue des formations",
    formationDetails: (id?: string) => {
        return `Formation ${id}`;
    },
    verifyMember: () => {
        return `Vérifie les informations de ton compte`;
    },
    incubatorDetailsEdit: (id?: string) => {
        return `Modifier la fiche incubateur de ${id}`;
    },
    incubatorList: () => "Rechercher un incubateur",
    incubatorCreate: function (): string {
        return `Créer une fiche incubateur`;
    },
    incubatorDetails: function (): string {
        return `Fiche incubateur`;
    },
};
