import { Metadata } from "next";
import { routeTitles } from "@/utils/routes/routeTitles";
import config from "@/config";

export const metadata: Metadata = {
    title: `${routeTitles.onboardingSuccess()} / Espace Membre`,
};

type Props = {
    params: { prNumber: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

export default function Page({ params, searchParams }: Props) {
    const { prNumber } = params;
    const { isEmailBetaAsked } = searchParams;
    const prUrl = `https://github.com/${config.githubRepository}/pull/${prNumber}`;
    return (
        <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
            <h3>C'est tout bon !</h3>

            <p>
                <b>
                    Ta fiche Github{" "}
                    <a href={prUrl} target="_blank">
                        a été créée
                    </a>
                    .
                </b>
            </p>

            {isEmailBetaAsked && (
                <>
                    <p>
                        Pour que ton adresse email <em>@beta.gouv.fr</em> soit
                        créée, la personne référente que tu as désigné (ou un
                        autre membre de la communauté) doit merger ta fiche.
                    </p>

                    <p>
                        Une fois la fiche validée, tu recevras les informations
                        de ta nouvelle adresse mail.
                    </p>
                </>
            )}

            <p>À bientôt !</p>
        </div>
    );
}
