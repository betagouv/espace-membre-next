"use client";
import {
    ReactElement,
    JSXElementConstructor,
    ReactNode,
    ReactPortal,
    PromiseLikeOfReactNode,
    useState,
} from "react";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";

import MemberBrevoEventList from "./MemberBrevoEventList";
import MemberEmailServiceInfo from "./MemberEmailServiceInfo";
import MemberEventList from "./MemberEventList";
import { EmailStatusCode } from "@/models/dbUser";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import routes, { computeRoute } from "@/routes/routes";

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
    primaryEmailStatus: EmailStatusCode;
    username: string;
    mattermostInfo: {
        hasMattermostAccount: boolean;
        isInactiveOrNotInTeam: boolean;
    };
    emailServiceInfo?: {
        primaryEmail?: {
            emailBlacklisted: boolean;
            listIds: number[];
        };
        secondaryEmail?: {
            emailBlacklisted: boolean;
            listIds: number[];
        };
    };
}

const ChangeSecondaryEmailBloc = ({ secondaryEmail, userInfos }) => {
    const [newSecondaryEmail, setNewSecondaryEmail] =
        useState<string>(secondaryEmail);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    return (
        <Accordion label="Définir/changer l'email secondaire pour cette personne">
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSaving(true);
                    axios
                        .post(
                            computeRoute(
                                routes.USER_UPDATE_SECONDARY_EMAIL_API
                            ).replace(":username", userInfos.id),
                            {
                                secondaryEmail: newSecondaryEmail,
                            },
                            {
                                withCredentials: true,
                            }
                        )
                        .then((data) => {
                            setIsSaving(false);
                        })
                        .catch((e) => {
                            setIsSaving(false);
                            console.error(e);
                        });
                }}
            >
                <Input
                    label="Email secondaire"
                    hintText="L'email secondaire est utile pour récupérer son mot de passe ou garder contact après ton départ."
                    nativeInputProps={{
                        name: "secondaryEmail",
                        defaultValue: newSecondaryEmail,
                        type: "email",
                        onChange: (e) => {
                            setNewSecondaryEmail(e.target.value);
                        },
                    }}
                />
                <Button
                    nativeButtonProps={{
                        type: "submit",
                        disabled: isSaving,
                    }}
                    children={
                        isSaving
                            ? `Sauvegarde en cours...`
                            : `Sauvegarder l'email secondaire`
                    }
                />
            </form>
        </Accordion>
    );
};

const CreateEmailForm = ({
    userInfos,
    hasPublicServiceEmail,
    username,
    secondaryEmail,
}) => {
    const [email, setValue] = useState<string>(secondaryEmail);
    return (
        <>
            <p>Tu peux créer un compte email pour {userInfos.fullname}.</p>
            {hasPublicServiceEmail &&
                `Attention s'iel a une adresse de service public en adresse primaire. L'adresse @beta.gouv.fr deviendra son adresse primaire :
celle à utiliser pour mattermost, et d'autres outils.`}
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    await axios.post(
                        computeRoute(
                            routes.USER_CREATE_EMAIL_API.replace(
                                ":username",
                                username
                            )
                        ),
                        {
                            to_email: email,
                        },
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
                        defaultValue: secondaryEmail,
                        name: "to_email",
                        type: "email",
                        required: true,
                        onChange: (e) => {
                            console.log(e.target.value);
                            setValue(e.target.value);
                        },
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
    );
};

function EmailUpgrade({ availableEmailPros, userInfos }) {
    const [password, setPassword] = useState<string>();
    const onSubmit = async () => {
        try {
            await axios.post(
                computeRoute(routes.USER_UPGRADE_EMAIL_API).replace(
                    ":username",
                    userInfos.id
                ),
                {
                    password,
                },
                { withCredentials: true }
            );
            alert(`Le compte sera upgradé d'ici quelques minutes`);
        } catch (e) {
            console.error(e);
            alert("Une erreur est survenue");
        }
    };
    return (
        <>
            <p>Il y a {availableEmailPros.length} comptes disponibles.</p>
            <p>Passer ce compte en pro : </p>
            <div
                className="no-margin"
                onSubmit={(e) => {
                    e.preventDefault();
                }}
            >
                <Input
                    label={`Un mot de passe pour ce compte`}
                    nativeInputProps={{
                        name: "password",
                        type: "password",
                        required: true,
                        min: 14,
                        onChange: (e) => {
                            setPassword(e.target.value);
                        },
                    }}
                />
                <Button onClick={onSubmit}>Upgrader en compte pro</Button>
            </div>
            <br />
            <br />
        </>
    );
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
    mattermostInfo,
}: // emailServiceInfo,
MemberPageProps) {
    const shouldDisplayUpgrade = Boolean(
        isAdmin &&
            availableEmailPros.length &&
            emailInfos &&
            !emailInfos.isPro &&
            !emailInfos.isExchange
    );
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
                <h2>Compte email</h2>
                {!!emailInfos && (
                    <>
                        <p className="text-color-blue font-weight-bold">
                            {emailInfos.email}
                            {emailInfos.isPro && `(offre OVH Pro)`}
                            {emailInfos.isExchange && `(offre OVH Exchange)`}
                        </p>
                        <ul>
                            <li>
                                statut de l'email :{" "}
                                {
                                    EMAIL_STATUS_READABLE_FORMAT[
                                        primaryEmailStatus
                                    ]
                                }
                            </li>
                            <li>
                                compte bloqué pour cause de spam :{" "}
                                {emailInfos.isBlocked
                                    ? "oui (contactez un.e administrat.eur.rice)"
                                    : "non"}
                            </li>
                        </ul>
                    </>
                )}
                <MemberEmailServiceInfo userId={username} />
                {[
                    EmailStatusCode.EMAIL_CREATION_WAITING,
                    EmailStatusCode.EMAIL_VERIFICATION_WAITING,
                ].includes(primaryEmailStatus) && (
                    <p>{EMAIL_STATUS_READABLE_FORMAT[primaryEmailStatus]}</p>
                )}
                {!emailInfos &&
                    ![
                        EmailStatusCode.EMAIL_CREATION_WAITING,
                        EmailStatusCode.EMAIL_VERIFICATION_WAITING,
                    ].includes(primaryEmailStatus) &&
                    canCreateEmail && (
                        <CreateEmailForm
                            userInfos={userInfos}
                            secondaryEmail={secondaryEmail}
                            username={username}
                            hasPublicServiceEmail={hasPublicServiceEmail}
                        />
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
                        <strong>Aucune redirection</strong>
                    </p>
                )}
            </div>
            <div className="fr-mb-8v">
                <h2>Compte mattermost</h2>
                {!!mattermostInfo && (
                    <ul>
                        <li>
                            Compte mattermost :{" "}
                            {!!mattermostInfo.hasMattermostAccount
                                ? "le compte existe"
                                : `aucun compte trouvé`}
                        </li>
                        <li>
                            Compte actif :{" "}
                            {!!mattermostInfo.isInactiveOrNotInTeam
                                ? `le compte est inactif ou n'est pas dans l'espace communauté`
                                : `le compte est actif`}
                        </li>
                    </ul>
                )}
            </div>
            {isAdmin && (
                <div className="fr-mb-8v">
                    <h2>Actions admin</h2>
                    <ChangeSecondaryEmailBloc
                        userInfos={userInfos}
                        secondaryEmail={secondaryEmail}
                    ></ChangeSecondaryEmailBloc>
                    <MemberBrevoEventList userId={username} />
                    <MemberEventList userId={username} />
                    {shouldDisplayUpgrade && (
                        <Accordion label="Passer en compte pro">
                            {shouldDisplayUpgrade && (
                                <EmailUpgrade
                                    availableEmailPros={availableEmailPros}
                                    userInfos={userInfos}
                                />
                            )}
                        </Accordion>
                    )}
                </div>
            )}
        </>
    );
}
