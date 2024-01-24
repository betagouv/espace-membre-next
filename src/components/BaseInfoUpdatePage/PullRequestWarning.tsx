import Alert from "@codegouvfr/react-dsfr/Alert";

export const PullRequestWarning = ({ pullRequest }) => {
    return (
        pullRequest && (
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
                        <a href={pullRequest.url} target="_blank">
                            {pullRequest.url}
                        </a>
                        <br />
                        (la prise en compte peut prendre 10 minutes.)
                    </>
                }
            />
        )
    );
};
