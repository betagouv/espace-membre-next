"use client";
import { useState } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios from "axios";
import { useSession } from "next-auth/react";

import MemberBrevoEventList from "./MemberBrevoEventList";
import MemberEmailServiceInfo from "./MemberEmailServiceInfo";
import MemberEventList from "./MemberEventList";
import { changeSecondaryEmailForUser } from "@/app/api/member/actions";
import { EmailStatusCode, memberWrapperSchemaType } from "@/models/member";
import { memberBaseInfoSchemaType } from "@/models/member";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import { missionSchemaType } from "@/models/mission";
import routes, { computeRoute } from "@/routes/routes";
import { getLastMission, getLastMissionDate } from "@/utils/member";

export interface MemberPageProps {
    emailInfos: memberWrapperSchemaType["emailInfos"];
    redirections: memberWrapperSchemaType["emailRedirections"];
    authorizations: memberWrapperSchemaType["authorizations"];
    userInfos: memberBaseInfoSchemaType;
    availableEmailPros: string[];
    mattermostInfo: {
        hasMattermostAccount: boolean;
        isInactiveOrNotInTeam: boolean;
    };
    isExpired: boolean;
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

const ChangeSecondaryEmailBloc = ({
    userInfos,
}: {
    userInfos: memberBaseInfoSchemaType;
}) => {
    const [newSecondaryEmail, setNewSecondaryEmail] = useState<string>(
        userInfos.secondary_email
    );
    const [isSaving, setIsSaving] = useState<boolean>(false);

    return (
        <Accordion label="Définir/changer l'email secondaire pour cette personne">
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSaving(true);
                    changeSecondaryEmailForUser(
                        newSecondaryEmail,
                        userInfos.username
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
}: {
    userInfos: memberBaseInfoSchemaType;
    hasPublicServiceEmail: boolean;
}) => {
    const [email, setValue] = useState<string>(userInfos.secondary_email);
    const [alertMessage, setAlertMessage] = useState<{
        title: string;
        message: NonNullable<React.ReactNode>;
        type: "success" | "warning";
    } | null>();
    return (
        <>
            <p>Tu peux créer un compte email pour {userInfos.fullname}.</p>
            {hasPublicServiceEmail &&
                `Attention s'iel a une adresse de service public en adresse primaire. L'adresse @beta.gouv.fr deviendra son adresse primaire :
celle à utiliser pour mattermost, et d'autres outils.`}
            {!!alertMessage && (
                <Alert
                    className="fr-mb-8v"
                    severity={alertMessage.type}
                    closable={false}
                    description={alertMessage.message}
                    title={alertMessage.title}
                />
            )}
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                        await axios.post(
                            computeRoute(
                                routes.USER_CREATE_EMAIL_API.replace(
                                    ":username",
                                    userInfos.username
                                )
                            ),
                            {
                                to_email: email,
                            },
                            {
                                withCredentials: true,
                            }
                        );
                        setAlertMessage({
                            title: `L'email est en cours de création`,
                            message: `L'email est en train d'être créé. ${userInfos.fullname} recevra un message dès que celui-ci sera actif.`,
                            type: "success",
                        });
                    } catch (e) {
                        if (e instanceof Error) {
                            setAlertMessage({
                                title: `Une erreur est survenue`,
                                message: e.message,
                                type: "warning",
                            });
                        }
                    }
                }}
            >
                <Input
                    label="Email personnel ou professionnel"
                    hintText="Le mot de passe et les informations de connexion seront envoyées à cet email"
                    nativeInputProps={{
                        defaultValue: userInfos.secondary_email,
                        name: "to_email",
                        type: "email",
                        required: true,
                        onChange: (e) => {
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

function EmailUpgrade({
    availableEmailPros,
    userInfos,
}: {
    userInfos: memberBaseInfoSchemaType;
    availableEmailPros: string[];
}) {
    const [password, setPassword] = useState<string>();
    const onSubmit = async () => {
        try {
            await axios.post(
                computeRoute(routes.USER_UPGRADE_EMAIL_API).replace(
                    ":username",
                    userInfos.username
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

function BlocMission({ mission }: { mission: missionSchemaType }) {
    return (
        <>
            <span>Mission : </span>
            du {new Date(mission.start).toLocaleDateString("fr-FR")}
            {mission.end &&
                ` au ${new Date(mission.end).toLocaleDateString("fr-FR")}`}
            <br />
            {mission.employer && (
                <>
                    <span>Employeur : </span>
                    {mission.employer}
                    <br />
                </>
            )}
        </>
    );
}

export default function MemberPage({
    emailInfos,
    redirections,
    userInfos,
    availableEmailPros,
    authorizations,
    mattermostInfo,
    isExpired,
}: // emailServiceInfo,
MemberPageProps) {
    const session = useSession();
    const isAdmin = session.data?.user.isAdmin;
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
                {isExpired && (
                    <>
                        <Alert
                            title={`Contrat de ${userInfos.fullname} arrivé à
                        expiration`}
                            severity="info"
                            description={
                                <div>
                                    <p>
                                        Le contrat de {userInfos.fullname} est
                                        arrivé à terme le{" "}
                                        <strong>
                                            {getLastMissionDate(
                                                userInfos.missions
                                            )}
                                        </strong>
                                        .
                                    </p>
                                    <p>
                                        Si {userInfos.fullname} est encore dans
                                        la communauté ou revient pour une
                                        nouvelle mission tu peux mettre à jour
                                        ses missions en cliquant sur le bouton
                                        ci-dessous :
                                    </p>
                                    <br />
                                    <Button
                                        linkProps={{
                                            href: `/community/${userInfos.username}/update`,
                                        }}
                                    >
                                        Mettre à jour les missions de{" "}
                                        {userInfos.fullname}
                                    </Button>
                                    <br />
                                </div>
                            }
                        />
                        <br />
                    </>
                )}
                {userInfos && (
                    <div>
                        <div className="fr-mb-8v">
                            <p>
                                <strong>{userInfos.fullname}</strong>
                                <br />
                                {userInfos.role}
                                <br />
                                {(userInfos.competences &&
                                    userInfos.competences.length && (
                                        <>
                                            Compétences:{" "}
                                            {userInfos.competences.join(", ")}
                                            <br />
                                        </>
                                    )) ||
                                    null}
                                {getLastMission(userInfos.missions) && (
                                    <BlocMission
                                        mission={
                                            getLastMission(userInfos.missions)!
                                        }
                                    ></BlocMission>
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
                                <br />
                                <span>Email principal : </span>{" "}
                                {userInfos.primary_email ? (
                                    <a
                                        href={`mailto:${userInfos.primary_email}`}
                                    >
                                        {userInfos.primary_email}
                                    </a>
                                ) : (
                                    "Non renseigné"
                                )}
                                <br />
                                <span>Email secondaire : </span>{" "}
                                {userInfos.secondary_email ? (
                                    <a
                                        href={`mailto:${userInfos.secondary_email}`}
                                    >
                                        {userInfos.secondary_email}
                                    </a>
                                ) : (
                                    "Non renseigné"
                                )}
                                <br />
                                {userInfos.link && (
                                    <>
                                        <span>URL : </span>
                                        <a
                                            href={userInfos.link}
                                            target="_blank"
                                        >
                                            {userInfos.link}
                                        </a>
                                    </>
                                )}
                                <br />
                            </p>
                        </div>
                    </div>
                )}
                {!userInfos && (
                    <>
                        <p>Il n'y a de fiche pour ce membre sur github</p>
                        <a
                            className="button no-margin"
                            href={"/"}
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
                            <a href={`mailto:${emailInfos.email}`}>
                                {emailInfos.email}
                            </a>
                            {emailInfos.isPro && (
                                <Badge
                                    small
                                    className={fr.cx("fr-ml-1w")}
                                    severity="success"
                                >
                                    OVH Pro
                                </Badge>
                            )}
                            {emailInfos.isExchange && (
                                <Badge
                                    small
                                    className={fr.cx("fr-ml-1w")}
                                    severity="success"
                                >
                                    OVH Exchange
                                </Badge>
                            )}
                        </p>
                        <ul>
                            <li>
                                statut de l'email :{" "}
                                {
                                    EMAIL_STATUS_READABLE_FORMAT[
                                        userInfos.primary_email_status
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
                <MemberEmailServiceInfo userId={userInfos.username} />
                {[
                    EmailStatusCode.EMAIL_CREATION_WAITING,
                    EmailStatusCode.EMAIL_VERIFICATION_WAITING,
                ].includes(userInfos.primary_email_status) && (
                    <p>
                        {
                            EMAIL_STATUS_READABLE_FORMAT[
                                userInfos.primary_email_status
                            ]
                        }
                    </p>
                )}
                {!emailInfos &&
                    ![
                        EmailStatusCode.EMAIL_CREATION_WAITING,
                        EmailStatusCode.EMAIL_VERIFICATION_WAITING,
                    ].includes(userInfos.primary_email_status) &&
                    authorizations.canCreateEmail && (
                        <CreateEmailForm
                            userInfos={userInfos}
                            hasPublicServiceEmail={
                                authorizations.hasPublicServiceEmail
                            }
                        />
                    )}
                {isExpired && (
                    <>
                        <div className="notification error">
                            Le compte {userInfos.username} est expiré.
                        </div>
                    </>
                )}
            </div>
            <div className="fr-mb-8v">
                <h2>Redirections</h2>
                {redirections.map(function (redirection, i) {
                    return (
                        <div key={i} className="redirection-item">
                            {redirection.to}
                        </div>
                    );
                })}
                {!emailInfos?.isExchange &&
                    !emailInfos?.isPro &&
                    redirections.length === 0 && (
                        <p>
                            <strong>Aucune redirection</strong>
                        </p>
                    )}
                {emailInfos?.isPro && (
                    <p>
                        <strong>
                            Cet utilisateur à un compte email OVH pro, il peut
                            voir ses redirections depuis
                            `https://pro1.mail.ovh.net/owa/#path=/options/inboxrules`
                        </strong>
                    </p>
                )}
                {emailInfos?.isExchange && (
                    <p>
                        <strong>
                            Cet utilisateur à un compte email OVH Microsoft
                            Exchange, il peut voir ses redirections depuis les
                            paramètes de son webmail.
                        </strong>
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
                    ></ChangeSecondaryEmailBloc>
                    <MemberBrevoEventList userId={userInfos.username} />
                    <MemberEventList userId={userInfos.username} />
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
