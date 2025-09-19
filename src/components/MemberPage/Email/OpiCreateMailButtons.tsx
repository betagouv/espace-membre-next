import { useState, useEffect } from "react";
import { createDimailEmail } from "@/app/api/member/actions/create-dimail";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { memberSchemaType } from "@/models/member";
import { getDimailEmail } from "@/app/api/member/actions/get-dimail-email";
import Button from "@codegouvfr/react-dsfr/Button";

interface Props {
  userUuid: string;
  userInfos: memberSchemaType;
}

export const OpiCreateMailButtons = ({ userUuid, userInfos }: Props) => {
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
      await createDimailEmail(userUuid);
      setMessage(
        `✅ Le mail est en cours de création. Une invitation sera envoyée sur ${userInfos.secondary_email} dans quelques minutes.`,
      );
      setSuccess(true);
      // Optionnel : afficher un message de succès
    } catch (error) {
      console.error("Erreur lors de la création de l'email:", error);
      setMessage(
        `Erreur lors de la création de l'email ${userInfos.secondary_email}`,
      );
      // Optionnel : afficher un message d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Accordion label="Créer mon compte sur la suite numérique">
      Créez votre compte sur{" "}
      <a href="https://lasuite.numerique.gouv.fr/" target="_blank">
        la suite numérique
      </a>{" "}
      pour bénéficier d'une suite email et calendrier moderne et sécurisée.
      <br />
      <br />
      Votre compte actuel (OVH) restera accessible pendant un mois. Pensez à
      transférér vos anciens emails comme indiqué dans la documentation sur{" "}
      <a
        target="_blank"
        href="https://doc.incubateur.net/communaute/les-outils-de-la-communaute/emails/emails-suite-numerique#h-etape-4-recupererimporter-ses-anciens-mails"
      >
        doc.incubateur.net
      </a>
      <br />
      <br />
      <>
        {userInfos.secondary_email && emailToCreate ? (
          success ? (
            ""
          ) : (
            <Button
              iconId="ri-mail-check-fill"
              onClick={createDimailEmailHandler}
              disabled={isLoading}
              size="small"
            >
              Créer mon compte {emailToCreate} sur la Suite numérique
            </Button>
          )
        ) : (
          <div>
            Renseigne ton email secondaire avant de pouvoir créer ton compte sur
            la suite numérique.
          </div>
        )}
      </>{" "}
      {message}
    </Accordion>
  );
};
