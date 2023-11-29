import { localizedRoutes } from "./localizedRoutes";

export const routeTitles: {
    [routeName in keyof typeof localizedRoutes]:
        | (() => string)
        | ((id?: string) => string);
} = {
    account: () => "Mon compte",
    accountEditBaseInfo: () => "Mise à jour de mes informations",
    accountEditPrivateInfo: () => "Mise à jour de mes informations privées",
    accountBadge: () => "Demande de badge",
    community: () => "Rechercher un ou une membre",
    startupList: () => "Rechercher un produit",
    startupDetails: () => "",
    startupDetailsEdit: (id?: string) => {
        return `Modifier la fiche produit de ${id}`;
    },
    startupCreate: () => "Créer une fiche produit",
    adminMattermost: () => "Administration mattermost",
    home: () => "",
    login: () => "Me connecter",
    onboarding: () => "Créer une fiche membre",
};
