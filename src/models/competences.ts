export const competencesTechniques = [
    "Accessibilité",
    "Administration Système",
    "Développement",
    "Développement Backend",
    "Développement Frontend",
    "Développement Full-stack",
    "DevOps",
    "Sécurité informatique",
    "UI",
] as const;

export const competencesProduit = [
    "Communication",
    "Croissance",
    "Facilitation",
    "Intrapreneur(se)",
    "Product design",
    "Product strategy",
    "UX",
] as const;

export const competencesAutres = [
    "Administration Publique",
    "Coaching",
    "Communication",
    "Droit / Affaires juridiques",
] as const;

export const competences = {
    Produit: competencesProduit,
    Développement: competencesTechniques,
    Autres: competencesAutres,
};
