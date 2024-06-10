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
    adminMattermost: () => "Administration mattermost",
    home: () => "",
    signIn: () => "Me connecter",
    login: () => "Me connecter",
    onboarding: () => "Créer une fiche membre",
    onboardingSuccess: () => "Fiche membre créée",
    newsletters: () => "Infolettre",
    map: () => "Carte des membres",
    keskispasse: () => "Qu'est-ce qui se passe ?",
    formationList: () => "Catalogue des formations",
    formationDetails: (id?: string) => {
        return `Formation ${id}`;
    },
    verifyMember: () => {
        return `Vérifie les informations de ton compte`;
    },
};
