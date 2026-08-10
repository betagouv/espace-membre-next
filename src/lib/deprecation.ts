// En-tetes signalant qu'une route est depreciee au profit d'un successeur.
// Voir RFC 8594 (en-tete Deprecation) et RFC 8288 (Link rel=successor-version).
export function deprecationHeaders(
  successorPath: string,
): Record<string, string> {
  return {
    Deprecation: "true",
    Link: `<${successorPath}>; rel="successor-version"`,
  };
}
