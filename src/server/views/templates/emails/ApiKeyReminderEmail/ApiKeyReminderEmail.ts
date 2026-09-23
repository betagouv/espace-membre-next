import type { EmailProps } from "@/lib/email/email";

// Un seul type de courriel pour deux usages, discrimines par `event` : la
// notification de creation et le rappel. C'est aussi ce qui impose de stocker la
// FONCTION dans SUBJECTS_BY_TYPE et non son appel, contrairement aux six entrees
// existantes qui stockent une chaine deja calculee.
export function ApiKeyReminderEmailTitle(variables?: EmailProps["variables"]) {
  const { event, keyName } = (variables ?? {}) as {
    event?: "created" | "reminder";
    keyName?: string;
  };
  const name = keyName ? ` « ${keyName} »` : "";
  return event === "created"
    ? `Une clef d'API${name} vient d'être créée`
    : `Ta clef d'API${name} sert-elle toujours ?`;
}
