import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";

export default function FicheMembre({ userInfos }) {
    console.log("userInfos", userInfos);
    return (
        <div className="fr-mb-14v">
            <h2>Fiche Membre</h2>
            <div>
                {userInfos && (
                    <>
                        <p>
                            <strong>{userInfos.fullname}</strong>
                            <br />
                            {userInfos.role}
                        </p>
                        {userInfos.startups && (
                            <p>
                                <span className="font-weight-bold">
                                    Startups actuelles:
                                </span>
                                <br />
                                {userInfos.startups.map((startup: any) => {
                                    return (
                                        <>
                                            - {startup}
                                            <br />
                                        </>
                                    );
                                })}
                            </p>
                        )}
                        <p>
                            {userInfos.end && (
                                <>
                                    <span>
                                        <span className="font-weight-bold">
                                            Fin de mission :{" "}
                                        </span>
                                        {userInfos.end &&
                                            new Date(
                                                userInfos.end
                                            ).toLocaleDateString("fr-FR")}
                                    </span>
                                    <br />
                                </>
                            )}
                            {userInfos.employer && (
                                <>
                                    <span>
                                        Employeur :{" "}
                                        {userInfos.employer.replace(
                                            "admin/",
                                            ""
                                        )}
                                    </span>
                                    <br />
                                </>
                            )}
                            {userInfos.github && (
                                <>
                                    <span>
                                        {`Compte Github : `}
                                        {userInfos.github && (
                                            <a
                                                href={`https://github.com/${userInfos.github}`}
                                            >
                                                {userInfos.github}
                                            </a>
                                        )}
                                        {!userInfos.github && `Non renseigné`}
                                    </span>
                                    <br />
                                </>
                            )}
                        </p>
                    </>
                )}
                <p className="fr-text--xs" style={{ fontStyle: "italic" }}>
                    Une information n'est pas à jour ?
                </p>

                <Button
                    linkProps={{
                        href: "/account/base-info",
                    }}
                >
                    ✏️ Mettre à jour mes infos
                </Button>
            </div>
        </div>
    );
}
