// Utilitaires de phase pour l'API protegee. La phase courante est la derniere
// phase chronologiquement (les phases sont deja ordonnees par date de debut).
// On expose le nom brut : decider quelles phases sont terminales appartient au
// consommateur.
export function currentPhaseName(
  phases: ReadonlyArray<{ name: string }>,
): string | null {
  return phases.length ? phases[phases.length - 1].name : null;
}

// Parse un parametre ?phase=construction,acceleration en liste de noms.
export function parsePhaseFilter(param: string | null): string[] {
  return (param ?? "")
    .split(",")
    .map((phase) => phase.trim())
    .filter(Boolean);
}
