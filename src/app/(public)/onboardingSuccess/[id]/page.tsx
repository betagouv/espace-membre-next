"use client";

import config from "@/config";
import { useSearchParams } from "next/navigation";

export default function OnboardingSuccessPage({
    params,
}: {
    params: { id: string };
}) {
    const searchParams = useSearchParams();
    return (
        <div className="container container-small">
            <div className="panel margin-top-m">
                <h3>C'est tout bon !</h3>

                <p>
                    <b>
                        Ta fiche Github{" "}
                        <a
                            href={`https://github.com/${config.githubRepository}/pull/${params.id}`}
                            target="_blank"
                        >
                            a été créée
                        </a>
                        .
                    </b>
                </p>

                {searchParams.get("isEmailBetaAsked") && (
                    <>
                        <p>
                            Pour que ton adresse email <em>@beta.gouv.fr</em>{" "}
                            soit créée, la personne référente que tu as désigné
                            (ou un autre membre de la communauté) doit merger ta
                            fiche.
                        </p>
                        <p>
                            Une fois la fiche validée, tu recevras les
                            informations de ta nouvelle adresse mail.
                        </p>
                    </>
                )}
                <p>À bientôt !</p>
            </div>
        </div>
    );
}
