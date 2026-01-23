import { useState, useEffect } from "react";
import { createDimailEmail } from "@/app/api/member/actions/create-dimail";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { memberSchemaType } from "@/models/member";
import { getDimailEmail } from "@/app/api/member/actions/get-dimail-email";
import Button from "@codegouvfr/react-dsfr/Button";
import * as Sentry from "@sentry/nextjs";

interface Props {
  open: boolean;
  secondaryEmail: string;
}

export const DimailCreateMailButton = ({ secondaryEmail, open }: Props) => {
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

  return (
    <Accordion
      label="Créer mon compte sur la suite numérique"
      expanded={open}
      onExpandedChange={() => {}}
    >
      Créez votre compte sur{" "}
      <a href="https://lasuite.numerique.gouv.fr/" target="_blank">
        la suite numérique
      </a>{" "}
      pour bénéficier d'une suite email et calendrier moderne et sécurisée.
      <br />
      <br />
      Ton compte OVH actuel reste ouvert pendant encore un mois. Tu as donc tout
      le temps nécessaire pour récupérer tes anciens emails.
      <a
        target="_blank"
        href="https://doc.incubateur.net/communaute/les-outils-de-la-communaute/emails/emails-suite-numerique#h-etape-4-recupererimporter-ses-anciens-mails"
      >
        Notre documentation
      </a>{" "}
      te guide pas à pas dans la procédure de transfert et de sauvegarde.
      <br />
      <br />
      <>
        {secondaryEmail && emailToCreate ? (
          success ? (
            ""
          ) : (
            <Button
              iconId="ri-mail-check-fill"
              onClick={createDimailEmailHandler}
              disabled={isLoading}
              size="large"
            >
              Créer mon compte {emailToCreate} sur la Suite numérique
            </Button>
          )
        ) : !secondaryEmail ? (
          <div>
            Renseigne ton email secondaire avant de pouvoir créer ton compte sur
            la suite numérique.
          </div>
        ) : (
          ""
        )}
      </>{" "}
      {message}
    </Accordion>
  );
};
