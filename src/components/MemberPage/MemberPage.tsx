"use client";
import routes, { computeRoute } from "@/routes/routes";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";
import {
    ReactElement,
    JSXElementConstructor,
    ReactNode,
    ReactPortal,
    PromiseLikeOfReactNode,
} from "react";

export interface MemberPageProps {
    isExpired: boolean;
    emailInfos: any;
    redirections: any;
    userInfos: any;
    secondaryEmail: string;
    canCreateEmail: boolean;
    hasPublicServiceEmail: boolean;
    isAdmin: boolean;
    availableEmailPros: any;
    primaryEmailStatus: string;
    username: string;
}

export default function MemberPage({
    isExpired,
    emailInfos,
    redirections,
    userInfos,
    secondaryEmail,
    canCreateEmail,
    hasPublicServiceEmail,
    isAdmin,
    availableEmailPros,
    primaryEmailStatus,
    username,
}: MemberPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                <h2>Fiche Membre</h2>
                {isExpired &&
                    (emailInfos ||
                        (redirections && redirections.length > 0)) && (
                        <div>
                            <p className="fr-text--xl">
                                ❗ Contrat de {userInfos.fullname} arrivé à
                                expiration
                            </p>

                            <p>
                                Le contrat de {userInfos.fullname} est arrivé à
                                terme le <strong>{userInfos.end}</strong>.
                            </p>
                            <p>
                                Si {userInfos.fullname} a effectivement quitté
                                la communauté, clôturez son compte :
                            </p>
                            <ul>
                                <li>Clôturer son compte email</li>
                                <li>Supprimer toutes ses redirections</li>
                                <li>
                                    Rediriger des éventuels email vers
                                    depart@beta.gouv.fr
                                </li>
                            </ul>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (
                                        confirm(
                                            "Es-tu sûr de vouloir supprimer son compte email et ses redirections pour <%= userInfos.fullname %> ?"
                                        )
                                    ) {
                                        await axios.post(
                                            computeRoute(
                                                routes.USER_DELETE_EMAIL_API
                                            ).replace(":username", username),
                                            undefined,
                                            {
                                                withCredentials: true,
                                            }
                                        );
                                    }
                                }}
                            >
                                <div>
                                    <Button
                                        nativeButtonProps={{
                                            type: "submit",
                                        }}
                                    >
                                        Clôturer le compte
                                    </Button>
                                    <a
                                        className="fr-link"
                                        href={`https://github.com/betagouv/beta.gouv.fr/blob/master/content/_authors/${userInfos.id}.md`}
                                        target="_blank"
                                    >
                                        Mettre à jour le contrat
                                    </a>
                                </div>
                            </form>
                        </div>
                    )}
                {userInfos && (
                    <div>
                        <div className="fr-mb-8v">
                            <p>
                                <strong>{userInfos.fullname}</strong>
                                <br />
                                {userInfos.role}
                                <br />
                                <br />
                                {userInfos.start && (
                                    <>
                                        <span>Mission :</span>
                                        du{" "}
                                        {new Date(
                                            userInfos.start
                                        ).toLocaleDateString("fr-FR")}
                                        {userInfos.end &&
                                            `au ${new Date(
                                                userInfos.end
                                            ).toLocaleDateString("fr-FR")}`}
                                        <br />
                                    </>
                                )}
                                {userInfos.employer && (
                                    <>
                                        <span>Employeur : </span>
                                        {userInfos.employer}
                                        <br />
                                    </>
                                )}
                                <span>Compte Github : </span>
                                {userInfos.github && (
                                    <a
                                        href={`https://github.com/${userInfos.github}`}
                                    >
                                        {userInfos.github}
                                    </a>
                                )}
                                {!userInfos.github && `Non renseigné`}
                            </p>
                            <a
                                className="fr-link"
                                href={`https://github.com/betagouv/beta.gouv.fr/edit/master/content/_authors/${username}.md`}
                                target="_blank"
                            >
                                Modifier sur Github
                            </a>
                        </div>
                        <p>
                            <span>Email secondaire : </span>{" "}
                            {secondaryEmail || "Non renseigné"}
                        </p>
                    </div>
                )}
                {!userInfos && (
                    <>
                        <p>Il n'y a de fiche pour ce membre sur github</p>
                        <a
                            className="button no-margin"
                            href={`https://github.com/betagouv/beta.gouv.fr/new/master/content/_authors/?filename=${username}.md`}
                            target="_blank"
                        >
                            Créer sur Github
                        </a>
                    </>
                )}
            </div>
            <div className="fr-mb-8v">
                <h2>Compte mail</h2>
                {emailInfos && (
                    <>
                        <p className="text-color-blue font-weight-bold">
                            {emailInfos.email}
                            {emailInfos.isPro && `(offre OVH Pro)`}
                            {emailInfos.isExchange && `(offre OVH Exchange)`}
                        </p>
                        {isAdmin && (
                            <>
                                {availableEmailPros.length &&
                                    emailInfos &&
                                    !emailInfos.isPro &&
                                    !emailInfos.isExchange && (
                                        <>
                                            <p>
                                                Il y a{" "}
                                                {availableEmailPros.length}{" "}
                                                compte disponibles.
                                            </p>
                                            <p>Passer ce compte en pro : </p>
                                            <form
                                                onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    await axios.post(
                                                        `/users/${userInfos.id}/email-upgrade`,
                                                        undefined,
                                                        {
                                                            withCredentials:
                                                                true,
                                                        }
                                                    );
                                                }}
                                            >
                                                <Input
                                                    label="Un mot de passe pour ton compte"
                                                    nativeInputProps={{
                                                        name: "password",
                                                        type: "password",
                                                        required: true,
                                                        min: 8,
                                                    }}
                                                />
                                                <Button
                                                    nativeButtonProps={{
                                                        type: "submit",
                                                    }}
                                                >
                                                    Upgrader en compte pro
                                                </Button>
                                            </form>
                                            <br />
                                            <br />
                                        </>
                                    )}
                            </>
                        )}
                        <ul>
                            <li>statut de l'email : {primaryEmailStatus}</li>
                            <li>
                                compte bloqué pour cause de spam :{" "}
                                {emailInfos.isBlocked
                                    ? "oui (contactez un.e administrat.eur.rice)"
                                    : "non"}
                            </li>
                        </ul>
                    </>
                )}
                {!emailInfos && (
                    <>
                        {canCreateEmail && (
                            <>
                                <p>
                                    Tu peux créer un compte mail pour{" "}
                                    {userInfos.fullname}.
                                </p>
                                {hasPublicServiceEmail &&
                                    `Attention s'iel a une adresse de service public en adresse primaire. L'adresse @beta.gouv.fr deviendra son adresse primaire :
                    celle à utiliser pour mattermost, et d'autres outils.`}
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        await axios.post(
                                            `/users/${username}/email`,
                                            undefined,
                                            {
                                                withCredentials: true,
                                            }
                                        );
                                    }}
                                >
                                    <Input
                                        label="Email personnel ou professionnel"
                                        hintText="Le mot de passe et les informations de connexion seront envoyées à cet email"
                                        nativeInputProps={{
                                            value: secondaryEmail,
                                            name: "to_email",
                                            type: "email",
                                            required: true,
                                        }}
                                    />
                                    <Button
                                        nativeButtonProps={{
                                            type: "submit",
                                        }}
                                    >
                                        Créer un compte
                                    </Button>
                                </form>
                            </>
                        )}
                    </>
                )}
                {isExpired && (
                    <>
                        <div className="notification error">
                            Le compte {username} est expiré.
                        </div>
                    </>
                )}
            </div>
            <div className="fr-mb-8v">
                <h2>Redirections</h2>
                {redirections.map(function (redirection: {
                    to:
                        | string
                        | number
                        | boolean
                        | ReactElement<any, string | JSXElementConstructor<any>>
                        | Iterable<ReactNode>
                        | ReactPortal
                        | PromiseLikeOfReactNode
                        | null
                        | undefined;
                }) {
                    <div className="redirection-item">{redirection.to}</div>;
                })}
                {redirections.length === 0 && (
                    <p>
                        <strong>Aucune</strong>
                    </p>
                )}
            </div>
            {isAdmin && (
                <div className="fr-mb-8v">
                    <h2>Actions admin</h2>
                    <Accordion label="Définir/changer l'email secondaire pour cette personne">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                await axios.post(
                                    computeRoute(
                                        routes.USER_UPDATE_SECONDARY_EMAIL
                                    ).replace(":username", userInfos.id),
                                    undefined,
                                    {
                                        withCredentials: true,
                                    }
                                );
                            }}
                        >
                            <Input
                                label="Email secondare"
                                hintText="L'email secondaire est utile pour récupérer son mot de passe ou garder contact après ton départ."
                                nativeInputProps={{
                                    name: "secondaryEmail",
                                    value: secondaryEmail,
                                    type: "email",
                                }}
                            />
                            <Button
                                nativeButtonProps={{
                                    type: "submit",
                                }}
                            >
                                Sauvegarder l'email secondaire
                            </Button>
                        </form>
                    </Accordion>
                </div>
            )}
        </>
    );
}
