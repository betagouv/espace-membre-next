import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const PullRequestWarning = ({ url }: { url: string }) => {
    return (
        url && (
            <Alert
                className="fr-mb-8v"
                severity="warning"
                small={true}
                closable={false}
                title="Une pull request existe déjà sur cette fiche."
                description={
                    <>
                        {`Toi ou un membre de ton équipe doit la merger
                                pour que les changements soient pris en compte : `}
                        <a href={url} target="_blank">
                            {url}
                        </a>
                        <br />
                        (la prise en compte peut prendre 10 minutes.)
                    </>
                }
            />
        )
    );
};
