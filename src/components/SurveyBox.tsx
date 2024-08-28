import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { add } from "date-fns";
import { useCookie } from "react-use";

export const SURVEY_BOX_COOKIE_NAME = "espace-membre-survey";

// cookie value is passed by server
export const SurveyBox = ({ value }: { value: string | null }) => {
    const [_, updateCookie] = useCookie(SURVEY_BOX_COOKIE_NAME);
    const onClose = () => {
        updateCookie("closed", { expires: add(new Date(), { days: 7 }) });
    };
    return (
        !value && (
            <Alert
                severity="info"
                closable={true}
                onClose={onClose}
                className={fr.cx("fr-mb-2w")}
                title="Donnez votre avis sur l’Espace Membre"
                description={
                    <>
                        Répondez à 3 questions pour nous permettre d’améliorer
                        l’espace membre
                        <br />
                        <a
                            href="https://tally.so/r/w8eR2x"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Voir le questionnaire
                        </a>
                    </>
                }
            />
        )
    );
};
