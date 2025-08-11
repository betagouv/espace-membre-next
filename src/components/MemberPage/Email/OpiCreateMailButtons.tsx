import { useState } from 'react';
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createDimailEmail } from "@/app/api/member/actions/create-dimail";

interface Props {
  userUuid: string;
}

export const OpiCreateMailButtons = ({ userUuid }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const createDimailEmailHandler = async () => {
    try {
      setIsLoading(true);
      await createDimailEmail(userUuid);
      // Optionnel : afficher un message de succès
    } catch (error) {
      console.error('Erreur lors de la création de l\'email:', error);
      // Optionnel : afficher un message d'erreur
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button
        iconId="ri-mail-check-fill"
        onClick={createDimailEmailHandler}
        disabled={isLoading}
        size="small"
      >
        {isLoading ? 'Création en cours...' : 'Passer son adresse chez la Suite numérique'}
      </Button>
    </>
  );
};
