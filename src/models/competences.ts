export const competencesTechniques = [
    "Accessibilité",
    "Administration Système",
    "Data Science",
    "Développement Backend",
    "Développement Frontend",
    "Développement Full-stack",
    "DevOps",
    "Docker",
    "ElasticSearch",
    "JavaScript/TypeScript",
    "Kubernetes",
    "Machine learning",
    "Matomo",
    "Metabase",
    "PHP",
    "PostgreSQL",
    "Python",
    "Ruby",
    "Sécurité informatique",
    "UI",
] as const;

export const competencesProduit = [
    "Croissance",
    "Facilitation",
    "Intrapreneur(se)",
    "Product design",
    "Product strategy",
    "UX",
    "SEO",
    "SEM",
] as const;

export const competencesAutres = [
    "Administration Publique",
    "Coaching",
    "Communication",
    "Droit / Affaires juridiques",
] as const;

export const competences = {
    Produit: competencesProduit,
    Technique: competencesTechniques,
    Autres: competencesAutres,
};

export const competencesList = Object.values(competences).flatMap((c) => c);
