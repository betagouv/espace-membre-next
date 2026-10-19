import Alert from "@codegouvfr/react-dsfr/Alert";
import { getServerSession } from "next-auth";

import { getLegacyEmailLoginConfig } from "@/lib/auth/legacyEmailLogin";
import { authOptions } from "@/lib/authoptions";

// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
export async function LegacyEmailLoginNotice() {
  const session = await getServerSession(authOptions);
  if (session?.user.provider !== "email") {
    return null;
  }
  const { endDate } = getLegacyEmailLoginConfig();
  const days = endDate
    ? Math.ceil((endDate.getTime() - Date.now()) / (24 * 3600 * 1000))
    : null;
  return (
    <Alert
      className="fr-mb-4w"
      severity="warning"
      closable={false}
      title="La connexion par email va disparaître"
      description={
        <>
          {days !== null && days > 0
            ? `Dans ${days} jour${days > 1 ? "s" : ""}, `
            : "Bientôt, "}
          tu ne pourras plus te connecter avec un lien envoyé par email. À ta
          prochaine connexion, utilise <strong>ProConnect</strong> avec ton
          adresse @beta.gouv.fr ou ton adresse du service public. Une difficulté
          ? <a href="/support">Consulte la page d'aide</a>.
        </>
      }
    />
  );
}
