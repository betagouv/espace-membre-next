import { useState, useEffect } from "react";
import { createDimailEmail } from "@/app/api/member/actions/create-dimail";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { memberSchemaType } from "@/models/member";
import { getDimailEmail } from "@/app/api/member/actions/get-dimail-email";
import Button from "@codegouvfr/react-dsfr/Button";
import * as Sentry from "@sentry/nextjs";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";

interface Props {
  secondaryEmail: string;
}

export const DimailEmailCreationInvite = ({ secondaryEmail }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailToCreate, setEmailToCreate] = useState<string | null>();

  useEffect(() => {
    const init = async () => {
      const email = await getDimailEmail();
      setEmailToCreate(email.data);
    };
    init();
  }, []);

  const createDimailEmailHandler = async () => {
    try {
      setIsLoading(true);
      await createDimailEmail();
      setMessage(
        `✅ Le mail est en cours de création. Une invitation sera envoyée sur ${secondaryEmail} dans quelques minutes.`,
      );
      setSuccess(true);
      // Optionnel : afficher un message de succès
    } catch (error) {
      console.error("Erreur lors de la création de l'email:", error);
      setMessage(`Erreur lors de la création de l'email ${secondaryEmail}`);
      Sentry.captureException(error);
      // Optionnel : afficher un message d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const alertContent = (
    <>
      <div className={fr.cx("fr-mt-2w", "fr-mb-2w")} />
      Ton compte email (OVH) va bientôt être décommissionné au profit d’un
      compte sur La Suite Numérique, plus moderne et plus sécurisé.
      <div />
      <div
        className={fr.cx("fr-mt-2w", "fr-text--xs")}
        style={{ color: fr.colors.decisions.text.mention.grey.default }}
      >
        Comment ça marche ?<br />
        <ol>
          <li>Créé ton compte {emailToCreate || ""} sur la Suite Numérique</li>
          <li>
            Migre ton historique et tes contacts de OVH vers ton nouveau compte
          </li>
          <li>
            Profite des nouvelles fonctionnalités (calendriers partagés,
            interface web accessible...)
          </li>
        </ol>
      </div>
      <div className={fr.cx("fr-mb-2w")}>{message}</div>
      {(secondaryEmail && (
        <Button
          priority="primary"
          className={fr.cx("fr-mr-1w")}
          onClick={createDimailEmailHandler}
          disabled={isLoading || success}
        >
          Créer mon compte sur la Suite Numérique
        </Button>
      )) || (
        <div className={fr.cx("fr-mb-2w")}>
          <Link href="/account?tab=compte-email">
            Renseigne ton email secondaire
          </Link>{" "}
          avant de pouvoir créer ton compte sur la suite numérique.
        </div>
      )}
      <Button
        linkProps={{
          href: `https://doc.incubateur.net/communaute/les-outils-de-la-communaute/emails/emails-suite-numerique`,
        }}
        priority="secondary"
      >
        Voir la documentation pas à pas
      </Button>
    </>
  );
  return (
    <Alert
      title="Migration de ton compte email"
      severity="warning"
      description={alertContent}
    />
  );
};
