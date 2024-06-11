"use client";
import React from "react";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import axios, { AxiosError } from "axios";

import { useLiveChat } from "../live-chat/useLiveChat";
import MemberSelect from "../MemberSelect";
import { EmailStatusCode } from "@/models/member";
import {
    memberBaseInfoSchemaType,
    memberPublicInfoSchemaType,
    memberWrapperPublicInfoSchemaType,
} from "@/models/member";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import routes from "@/routes/routes";

enum STEP {
    whichMember = "whichMember",
    updateEndDate = "updateEndDate",
    createEmail = "createEmail",
    showUserInfo = "showUserInfo",
    waitingForDateToBeUpdated = "waitingForDateToBeUpdated",
    accountPendingCreation = "accountPendingCreation",
    everythingIsGood = "everythingIsGood",
    emailSuspended = "emailSuspended",
    showMember = "showMember",
    accountCreated = "accountCreated",
    emailBlocked = "emailBlocked",
    shouldChangedPassword = "shouldChangedPassword",
    hasMattermostProblem = "hasMattermostProblem",
    doNotReceivedEmail = "doNotReceivedEmail",
}

interface FormErrorResponse {
    errors?: Record<string, string[]>;
    message: string;
}

export interface WhatIsGoingOnWithMemberProps {
    users: memberPublicInfoSchemaType[];
}

const ConnectedScreen = (props) => {
    const INITIAL_TIME = 30;
    const [connected, setConnected] = React.useState(false);
    const [seconds, setSeconds] = React.useState(INITIAL_TIME);
    const [loginSent, setLoginSent] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [calledOnce, setCalledOnce] = React.useState(false);
    const [wasAlreadyConnected, setWasAlreadyConnected] = React.useState(false);
    const pingConnection = async () => {
        console.log("Ping connection");
        const user = await axios
            .get(routes.ME)
            .then((res) => res.data.user)
            .catch((e) => {
                console.log(`L'utilisateur n'est pas connecté`);
            });
        if (user) {
            if (!calledOnce) {
                setWasAlreadyConnected(true);
            }
            setConnected(true);
        }
        if (!calledOnce) {
            setCalledOnce(true);
        }
    };
    React.useEffect(() => {
        // exit early when we reach 0
        if (!seconds) return;

        // save intervalId to clear the interval when the
        // component re-renders
        const intervalId = setInterval(() => {
            const prev = seconds;
            if (seconds === INITIAL_TIME) {
                pingConnection().catch(console.error);
            }
            if (prev - 1 === 0) {
                setSeconds(INITIAL_TIME);
            } else {
                setSeconds(seconds - 1);
            }
        }, 1000);

        // clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
        // add seconds as a dependency to re-rerun the effect
        // when we update it
    }, [seconds]);

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios
                .post(routes.LOGIN_API, {
                    emailInput: email,
                })
                .then((res) => res.data);
            setLoginSent(true);
            await pingConnection();
        } catch (e) {
            if (axios.isAxiosError(e)) {
                // Ici, TypeScript sait que `e` est de type AxiosError
                if (e.response) {
                    alert(e.response.data.errors);
                } else {
                    // Gérer les cas où la réponse n'est pas disponible
                    alert(
                        "Une erreur s'est produite, mais aucune réponse n'a été reçue"
                    );
                }
            } else {
                alert("Une erreur s'est produite");
            }
        }
    };

    return (
        <>
            <h2>{props.title}</h2>
            {calledOnce && !wasAlreadyConnected && (
                <div className="notification">
                    <p>
                        <b>
                            Pour effectuer cette action il faut être connecter,
                            nous allons t'envoyer un lien de connexion
                        </b>
                    </p>
                    {!connected && !loginSent && (
                        <form
                            action=""
                            method="POST"
                            id="login_form"
                            onSubmit={onSubmit}
                        >
                            <Input
                                label={`Ton email (@beta.gouv.fr ou secondaire)`}
                                nativeInputProps={{
                                    onChange: (e) => {
                                        setEmail(e.currentTarget.value);
                                    },
                                    name: "emailInput",
                                    type: "email",
                                    placeholder: "prenom.nom@beta.gouv.fr",
                                    autoComplete: "username",
                                }}
                            />
                            <Button>Recevoir le lien de connexion</Button>
                            <span>
                                <a href="#forgot" className="fr-link">
                                    J'ai oublié mon email
                                </a>
                            </span>
                        </form>
                    )}
                    {loginSent && !connected && (
                        <p>
                            Lien de connexion envoyé ! Clique sur le lien de
                            connexion que tu as reçu par email, puis sur "Me
                            connecter" et reviens sur cette page.
                            <br />
                            Nouveau test de connexion dans {seconds}s.
                        </p>
                    )}
                    {connected && <p>Tu es connecté !</p>}
                </div>
            )}
            {calledOnce && (
                <div
                    style={
                        !connected
                            ? { opacity: 0.5, pointerEvents: "none" }
                            : {}
                    }
                >
                    {props.children}
                </div>
            )}
        </>
    );
};

const EmailInfo = function ({ emailInfos, primary_email_status }) {
    return (
        <>
            <p>
                <span className="font-weight-bold">Email principal</span> :{" "}
                {emailInfos.email}
                {emailInfos.isPro && <span>(offre OVH Pro)</span>}
                {emailInfos.isExchange && <span>(offre OVH Exchange)</span>}
            </p>
            <p>
                <span className="font-weight-bold">Statut de l'email</span> :{" "}
                {EMAIL_STATUS_READABLE_FORMAT[primary_email_status]}
            </p>
            <p>
                <span className="font-weight-bold">
                    Compte bloqué pour cause de spam
                </span>{" "}
                : {emailInfos.isBlocked ? "oui" : "non"}
            </p>
        </>
    );
};

const UserInfo = function (props: {
    userInfos: memberWrapperPublicInfoSchemaType["userPublicInfos"];
    hasSecondaryEmail: memberWrapperPublicInfoSchemaType["hasSecondaryEmail"];
    mattermostInfo: memberWrapperPublicInfoSchemaType["mattermostInfo"];
}) {
    return (
        <>
            <p>
                <span className="font-weight-bold">Nom</span>:{" "}
                {props.userInfos.fullname}
            </p>
            <p>
                <span className="font-weight-bold">Rôle:</span>{" "}
                {props.userInfos.role}
            </p>
            {props.userInfos.missions && (
                <p>
                    <span className="font-weight-bold">
                        Startups actuelles:
                    </span>
                    <br />
                    {props.userInfos.missions.map(function (startup) {
                        return (
                            <>
                                - {startup}
                                <br />
                            </>
                        );
                    })}
                </p>
            )}
            {/* {props.userInfos.end && (
                <p>
                    <span className="font-weight-bold">Fin de mission :</span>
                    {props.userInfos.end &&
                        new Date(props.userInfos.end).toLocaleDateString(
                            "fr-FR"
                        )}
                </p>
            )}
            {props.userInfos.employer && (
                <p>
                    <strong>Employeur : </strong>
                    {props.userInfos.employer.replace("admin/", "")}
                </p>
            )} */}
            {props.userInfos.github && (
                <p>
                    <strong>Compte Github :</strong>
                    {props.userInfos.github && (
                        <a
                            className="fr-link"
                            href={`https://github.com/${props.userInfos.github}`}
                        >
                            {props.userInfos.github}
                        </a>
                    )}
                    {!props.userInfos.github && <p>Non renseigné</p>}
                </p>
            )}
            <p>
                <strong>Email secondaire :</strong>{" "}
                {props.hasSecondaryEmail
                    ? `un email secondaire est renseigné sur la fiche`
                    : `pas d'email secondaire renseigné`}
            </p>
            <p>
                <strong>Compte mattermost:</strong>{" "}
                {props.mattermostInfo?.hasMattermostAccount
                    ? `un compte mattermost a été trouvé ${
                          props.mattermostInfo?.isInactiveOrNotInTeam
                              ? `mais il est inactif ou pas dans l'espace Communauté`
                              : ""
                      }`
                    : `pas de compte mattermost trouvé`}
            </p>
        </>
    );
};

const MemberComponent = function ({
    memberWrapper: {
        isExpired,
        hasEmailInfos,
        userPublicInfos,
        isEmailBlocked,
        hasSecondaryEmail,
        mattermostInfo,
    },
    startFix,
}: {
    memberWrapper: memberWrapperPublicInfoSchemaType;
    startFix: (step: any) => void;
}) {
    const steps = [STEP.whichMember, STEP.showMember];
    const showSteps =
        !!isExpired ||
        !hasEmailInfos ||
        userPublicInfos.primary_email_status ===
            EmailStatusCode.EMAIL_SUSPENDED ||
        !!isEmailBlocked;
    if (!!isExpired) {
        steps.push(STEP.updateEndDate);
        steps.push(STEP.waitingForDateToBeUpdated);
    }
    if (!hasEmailInfos) {
        steps.push(STEP.createEmail);
        steps.push(STEP.accountPendingCreation);
        steps.push(STEP.accountCreated);
    }
    if (
        userPublicInfos.primary_email_status ===
            EmailStatusCode.EMAIL_SUSPENDED &&
        !isEmailBlocked
    ) {
        steps.push(STEP.emailSuspended);
    }
    if (
        userPublicInfos.primary_email_status !==
            EmailStatusCode.EMAIL_SUSPENDED &&
        isEmailBlocked
    ) {
        steps.push(STEP.emailBlocked);
    }
    steps.push(STEP.everythingIsGood);
    return (
        <div>
            <h2>{userPublicInfos.fullname}</h2>
            <UserInfo
                userInfos={userPublicInfos}
                mattermostInfo={mattermostInfo}
                hasSecondaryEmail={hasSecondaryEmail}
            />
            {/* {!!emailInfos && (
                <EmailInfo
                    emailInfos={emailInfos}
                    primary_email_status={primary_email_status}
                />
            )} */}
            {showSteps && (
                <>
                    <h3>Quels sont les problèmes ?</h3>
                    <ul>
                        {!!isExpired && (
                            <li>
                                Le contrat de {userPublicInfos.fullname} est
                                arrivé à terme le{" "}
                                {/* <strong>{userPublicInfos.end}</strong>. */}
                            </li>
                        )}
                        {userPublicInfos.primary_email_status ===
                            EmailStatusCode.EMAIL_SUSPENDED && (
                            <li>
                                Son email @beta.gouv.fr est suspendu car sa date
                                de fin a été mise à jour en retard
                            </li>
                        )}
                        {!hasEmailInfos && <li>Son email a été supprimé.</li>}
                    </ul>
                </>
            )}
            {showSteps && (
                <>
                    <div className="notification">
                        <p>Pour réactiver son compte il faut :</p>
                        <ol>
                            {!!isExpired && (
                                <li>changer sa date de fin et merger la PR</li>
                            )}
                            {!hasEmailInfos && <li>Re-créer son email beta</li>}
                            {userPublicInfos.primary_email_status ===
                                EmailStatusCode.EMAIL_SUSPENDED && (
                                <li>
                                    changer son mot de passe pour réactiver son
                                    email
                                </li>
                            )}
                            {!!isEmailBlocked && (
                                <li>
                                    L'email est bloqué pour cause de spam, il
                                    faut le réactiver en changeant le mot de
                                    passe
                                </li>
                            )}
                        </ol>
                        {!hasEmailInfos && !!hasSecondaryEmail && (
                            <p>
                                Si tu es un collègue de{" "}
                                {userPublicInfos.fullname} tu pourras recréer
                                l'email pour lui/elle :).
                            </p>
                        )}
                        {!hasEmailInfos && !!hasSecondaryEmail && (
                            <p>
                                Si tu es {userPublicInfos.fullname} tu pourras
                                recréer l'email toi même une fois ta date de fin
                                à jour.
                            </p>
                        )}
                        {!hasEmailInfos && !hasSecondaryEmail && (
                            <p>
                                {userPublicInfos.fullname} n'a pas d'email
                                secondaire, si tu es toi même{" "}
                                {userPublicInfos.fullname} il va falloir qu'un
                                collègue le fasse à ta place.
                            </p>
                        )}
                    </div>
                </>
            )}
            {!showSteps && (
                <>
                    <div className="notification">
                        <p>
                            A priori, il n'y a pas de soucis avec cet
                            utilisateur
                        </p>
                    </div>
                    <p>
                        Cependant {userPublicInfos.fullname} rencontre peut être
                        un des problèmes <span>suivants :</span>
                    </p>
                    <ul>
                        <li>
                            Je n'arrive pas à accéder a mon email
                            @beta.gouv.fr/Mon mot de passe ne marche plus.
                            <br />
                            ➡️{" "}
                            <Button
                                onClick={() =>
                                    startFix([
                                        STEP.whichMember,
                                        STEP.showMember,
                                        STEP.shouldChangedPassword,
                                    ])
                                }
                                priority="tertiary no outline"
                            >
                                Régler ce problème
                            </Button>
                        </li>
                        <li>
                            Je n'arrive pas à me connecter à mattermost.
                            <br /> ➡️{" "}
                            <Button
                                onClick={() =>
                                    startFix([
                                        STEP.whichMember,
                                        STEP.showMember,
                                        STEP.hasMattermostProblem,
                                    ])
                                }
                                priority="tertiary no outline"
                            >
                                Régler ce problème
                            </Button>
                        </li>
                        <li>
                            Je ne reçois pas mon email de connexion
                            <br /> ➡️{" "}
                            <Button
                                onClick={() =>
                                    startFix([
                                        STEP.whichMember,
                                        STEP.showMember,
                                        STEP.doNotReceivedEmail,
                                    ])
                                }
                                priority="tertiary no outline"
                            >
                                Régler ce problème
                            </Button>
                        </li>
                    </ul>
                </>
            )}
            {showSteps && (
                <>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Button
                            nativeButtonProps={{
                                onClick: () => startFix(steps),
                            }}
                        >
                            Commencer la procédure
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export const UpdateEndDateScreen = function (props) {
    const [date, setDate] = React.useState(props.date);
    const [isSaving, setIsSaving] = React.useState(false);
    const [formErrors, setFormErrors] = React.useState({});
    const [errorMessage, setErrorMessage] = React.useState("");
    function changeFormData(value) {
        setDate(value);
    }

    function updateDate() {
        if (isSaving) {
            return;
        }
        setIsSaving(true);
        axios
            .post(
                routes.API_PUBLIC_POST_BASE_INFO_FORM.replace(
                    ":username",
                    props.user.userInfos.id
                ),
                {
                    end: date,
                    role: props.user.userInfos.role || "",
                    startups: props.user.userInfos.startups || [],
                }
            )
            .then((resp) => {
                setIsSaving(false);
                props.setPullRequestURL(resp.data.pr_url);
                props.next();
            })
            .catch((resp) => {
                const ErrorResponse: FormErrorResponse = resp.data;
                setErrorMessage(ErrorResponse.message);
                setIsSaving(false);
                if (ErrorResponse.errors) {
                    setFormErrors(ErrorResponse.errors);
                }
            });
    }
    const title = `Tu peux changer la date de fin pour ${props.user.userInfos.fullname}.`;

    return (
        <ConnectedScreen title={title}>
            <h3>
                Mise à jour de la date de fin pour{" "}
                {props.user.userInfos.fullname}
            </h3>
            <div>
                {!!errorMessage && (
                    <p className="text-small text-color-red">{errorMessage}</p>
                )}
                <Input
                    label="Fin de la mission (obligatoire)"
                    hintText={`Si tu n'as pas la date exacte, mets une date dans 6
                        mois, c'est possible de la corriger plus tard. Au format JJ/MM/YYYY`}
                    nativeInputProps={{
                        min: "2020-01-31",
                        type: "date",
                        onChange: (e) => changeFormData(e.currentTarget.value),
                    }}
                    state={
                        !!formErrors["nouvelle date de fin"]
                            ? "error"
                            : "default"
                    }
                    stateRelatedMessage={formErrors["nouvelle date de fin"]}
                />
                <div className="form__group">
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Button
                            onClick={updateDate}
                            disabled={isSaving}
                            type="submit"
                        >
                            Valider le changement de date
                        </Button>
                    </div>
                </div>
            </div>
        </ConnectedScreen>
    );
};

const AccountPendingCreationScreen = function ({
    getUser,
    next,
    user,
}: {
    getUser;
    next;
    user: memberWrapperPublicInfoSchemaType;
}) {
    const INITIAL_TIME = 60;
    const [seconds, setSeconds] = React.useState(INITIAL_TIME);
    React.useEffect(() => {
        // exit early when we reach 0
        if (!seconds) return;

        const intervalId = setInterval(() => {
            const prev = seconds;
            if (seconds === INITIAL_TIME) {
                getUser(user.userPublicInfos.username).catch(console.error);
            }
            if (prev - 1 === 0) {
                setSeconds(INITIAL_TIME);
            } else {
                setSeconds(seconds - 1);
            }
        }, 1000);
        return () => clearInterval(intervalId);
    }, [seconds, user]);

    return (
        <div>
            <h2>Création du compte de {user.userPublicInfos.username}</h2>
            {user &&
                user.userPublicInfos.primary_email_status !==
                    EmailStatusCode.EMAIL_ACTIVE && (
                    <>
                        <p>Création en cours ...</p>
                        <p>
                            Un email informant de la création du compte sera
                            envoyé d'ici 10min
                        </p>
                        <p>Recheck automatique d'ici {seconds}s</p>
                        <button className="button" onClick={() => next()}>
                            C'est bon {user.userPublicInfos.fullname} a bien
                            reçu l'email
                        </button>
                    </>
                )}
            {user &&
                user.userPublicInfos.primary_email_status ===
                    EmailStatusCode.EMAIL_ACTIVE && (
                    <>
                        <p className="notification">
                            C'est bon le compte de{" "}
                            {user.userPublicInfos.fullname} est actif.
                        </p>
                        <button className="button" onClick={() => next()}>
                            Passer à l'étape suivante
                        </button>
                    </>
                )}
        </div>
    );
};

const isDateInTheFuture = function (date: Date) {
    return date > new Date();
};

export const UpdateEndDatePendingScreen = function ({
    getUser,
    user,
    pullRequestURL,
    next,
}) {
    const DEFAULT_TIME = 60;
    const [seconds, setSeconds] = React.useState(DEFAULT_TIME);
    const [prStatus, setPRStatus] = React.useState("notMerged");
    const checkPR = async () => {
        try {
            const pullRequests = await axios
                .get(routes.PULL_REQUEST_GET_PRS)
                .then((resp) => resp.data.pullRequests);
            const pullRequestURLs = pullRequests.map((pr) => pr.html_url);
            if (!pullRequestURLs.includes(pullRequestURL)) {
                setPRStatus("merged");
                setSeconds(DEFAULT_TIME);
            }
        } catch (e) {
            console.log(e);
        }
    };

    const checkPRChangesAreApplied = async () => {
        try {
            const data = await getUser(user.userInfos.id);
            if (isDateInTheFuture(new Date(data.userInfos.end))) {
                setPRStatus("validated");
                setSeconds(DEFAULT_TIME);
                // user date is now in the future
            }
        } catch (e) {
            console.error(e);
        }
    };

    React.useEffect(() => {
        if (isDateInTheFuture(new Date(user.userInfos.end))) {
            setPRStatus("validated");
        }
    }, [user]);

    React.useEffect(() => {
        // exit early when we reach 0
        if (!seconds) return;

        // save intervalId to clear the interval when the
        // component re-renders
        const intervalId = setInterval(() => {
            const prev = seconds;
            if (seconds === DEFAULT_TIME && prStatus === "notMerged") {
                checkPR();
            }
            if (seconds === DEFAULT_TIME && prStatus === "merged") {
                checkPRChangesAreApplied();
            }
            if (prev - 1 === 0) {
                setSeconds(DEFAULT_TIME);
            } else {
                setSeconds(seconds - 1);
            }
        }, 1000);

        // clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
        // add seconds as a dependency to re-rerun the effect
        // when we update it
    }, [seconds, prStatus]);

    return (
        <>
            {prStatus === "notMerged" && (
                <>
                    <div>
                        <p>Une pull request en attente : </p>
                        <a
                            className="fr-link"
                            href={pullRequestURL}
                            target="_blank"
                        >
                            {pullRequestURL}
                        </a>
                    </div>
                    <p>
                        Il faut la merger pour que le changement de date de fin
                        soit prise en compte :
                    </p>
                    <p>
                        Suite au merge la prise en compte peut prendre 10
                        minutes
                    </p>
                </>
            )}
            {prStatus === "merged" && (
                <>
                    <p>
                        La PR a probablement été mergée. Le changement sera pris
                        en compte d'ici quelques minutes, il faut encore
                        attendre :)
                    </p>
                    <a
                        className="fr-link"
                        href={pullRequestURL}
                        target="_blank"
                    >
                        {pullRequestURL}
                    </a>
                </>
            )}
            {prStatus === "validated" && (
                <>
                    <p>
                        La date de fin est à jour c'est bon on peut passé à
                        l'étape suivante :
                    </p>
                    <button className={"button"} onClick={() => next()}>
                        Passer à l'étape suivante
                    </button>
                </>
            )}
            {prStatus !== "validated" && <p>Recheck dans {seconds} secondes</p>}
        </>
    );
};

export const WhichMemberScreen = function ({ setUser, getUser, users }) {
    const [isSearching, setIsSearching] = React.useState(false);

    const search = async (member: string) => {
        setIsSearching(true);
        try {
            const data = await getUser(member);
            setUser(data);
        } catch {
            alert(`Aucune info sur l'utilisateur`);
        }
        setIsSearching(false);
    };

    return (
        <>
            {
                <form className="no-margin">
                    <h2>Qu'est-ce qu'il se passe ?</h2>
                    <div className="fr-select-group">
                        <MemberSelect
                            label="Quelle personne veux-tu aider ? (ça peut être toi-même)"
                            hint="Cherche et sélectionne la personne que tu veux aider en tapant son nom ou son prénom."
                            name="username"
                            placeholder="Sélectionner un membre"
                            onChange={(e) => search(e.value)}
                            members={users.map((u) => ({
                                value: u.id,
                                label: u.fullname,
                            }))}
                            defaultValue={undefined}
                        />
                    </div>
                    <div>
                        <Button type="submit" disabled={isSearching}>
                            {!isSearching
                                ? `Voir la fiche`
                                : `Récupération des informations...`}
                        </Button>
                    </div>
                </form>
            }
        </>
    );
};

export const CreateEmailScreen = function (props) {
    const [emailValue, setEmailValue] = React.useState(props.secondaryEmail);
    const [isSaving, setIsSaving] = React.useState(false);
    React.useEffect(() => {
        if (props.user.hasEmailInfos) {
            props.next();
        }
    }, [props.user.hasEmailInfos]);
    const createEmail = async () => {
        if (isSaving) {
            return;
        }
        try {
            const api = routes.USER_CREATE_EMAIL_API.replace(
                ":username",
                props.user.userInfos.id
            );
            setIsSaving(false);
            const res = await axios.post(api, {
                to_email: emailValue,
            });
            if (res.status === 200) {
                props.next();
            } else {
                throw new Error("Email was not created");
            }
        } catch (e) {
            setIsSaving(false);
            console.error(e);
            alert("Un erreur est survenue");
        }
    };
    const title = `Tu peux créer un compte mail pour ${props.user.userInfos.fullname}.`;

    return (
        <ConnectedScreen title={title}>
            <div>
                {!!props.hasPublicServiceEmail && (
                    <p>
                        Attention s'iel a une adresse de service public en
                        adresse primaire. L'adresse @beta.gouv.fr deviendra son
                        adresse primaire : celle à utiliser pour mattermost, et
                        d'autres outils.
                    </p>
                )}
                <div className="fr-input-group">
                    <Input
                        label={"Email personnel ou professionnel"}
                        hintText={`Les informations de connexion seront envoyées à cet
                            email. ⚠️ Il ne s'agit pas de l'adresse
                            @beta.gouv.fr mais d'une autre adresse perso ou pro
                            à utiliser pour se connecter la première fois à
                            l'espace-membre.`}
                        nativeInputProps={{
                            defaultValue: props.secondaryEmail,
                            onChange: (event) => {
                                setEmailValue(event.target.value);
                            },
                            type: "email",
                            required: true,
                        }}
                    />
                </div>
                <Button
                    nativeButtonProps={{
                        disabled: isSaving,
                        onClick: createEmail,
                    }}
                >
                    Créer un compte
                </Button>
            </div>
        </ConnectedScreen>
    );
};

export const WhatIsGoingOnWithMember = function (
    props: WhatIsGoingOnWithMemberProps
) {
    const { users } = props;
    const { showLiveChat, isLiveChatLoading } = useLiveChat();

    const [step, setStep] = React.useState(STEP.whichMember);
    const [fixes, setFixes] = React.useState([
        STEP.whichMember,
        STEP.showMember,
    ]);
    const [user, setUser]: [
        memberWrapperPublicInfoSchemaType | undefined,
        (user: memberWrapperPublicInfoSchemaType) => void
    ] = React.useState();
    const [pullRequestURL, setPullRequestURL] = React.useState("");
    const getUser: (
        string
    ) => Promise<memberWrapperPublicInfoSchemaType> = async (member) => {
        return await axios
            .get(routes.API_GET_PUBLIC_USER_INFO.replace(":username", member))
            .then((resp) => {
                setUser(resp.data);
                return resp.data;
            });
    };

    React.useEffect(() => {
        if (localStorage.getItem("state")) {
            const state: {
                step: STEP;
                memberId: string;
                user: memberWrapperPublicInfoSchemaType;
                steps: STEP[];
                pullRequestURL: string;
            } = JSON.parse(localStorage.getItem("state")!);
            history.pushState(
                {
                    step: state.step || STEP.whichMember,
                },
                ""
            );
            if (state.step) {
                setStep(state.step);
            }
            if (state.steps) {
                setFixes(state.steps);
            }
            if (state.pullRequestURL) {
                setPullRequestURL(state.pullRequestURL);
            }
            if (state.user) {
                setUser(state.user);
                getUser(state.user.userPublicInfos.username).catch((e) => {
                    console.error(e);
                });
            }
        }
        window.onpopstate = (e) => {
            setStep(e.state.step);
            //your code...
        };
    }, []);

    function startFix(fixeItems) {
        setFixes(fixeItems);
        next(fixeItems);
    }
    function goBack() {
        const currentStepIndex = fixes.findIndex((s) => s === step);
        const nextStep = fixes[currentStepIndex - 1] || STEP.whichMember;
        setStep(nextStep);
        const state = {
            step: nextStep,
            memberId: user?.userPublicInfos.username,
            user: user,
            steps: fixes,
        };
        localStorage.setItem("state", JSON.stringify(state));
    }
    function resetLocalStorage() {
        setStep(STEP.whichMember);
        localStorage.removeItem("state");
    }

    function next(
        steps?: STEP[],
        paramUser?: memberWrapperPublicInfoSchemaType
    ) {
        const currentStepIndex = (steps || fixes).findIndex((s) => s === step);
        const nextStep = (steps || fixes)[currentStepIndex + 1];
        setStep(nextStep);
        const state = {
            step: nextStep,
            memberId: (paramUser || user)?.userPublicInfos?.username,
            user: paramUser || user,
            steps: steps || fixes,
        };
        history.pushState(state, "");
        localStorage.setItem("state", JSON.stringify(state));
    }
    let stepView;
    if (step === STEP.whichMember) {
        stepView = (
            <WhichMemberScreen
                users={props.users}
                setUser={(user) => {
                    setUser(user);
                    next([STEP.whichMember, STEP.showMember], user);
                }}
                getUser={getUser}
            />
        );
    } else if (step === STEP.showMember && user) {
        stepView = <MemberComponent memberWrapper={user} startFix={startFix} />;
        // } else if (step === STEP.updateEndDate && user) {
        //     stepView = (
        //         <UpdateEndDateScreen
        //             setPullRequestURL={setPullRequestURL}
        //             user={user}
        //             next={next}
        //         />
        //     );
        // } else if (step === STEP.createEmail && user) {
        //     stepView = (
        //         <CreateEmailScreen
        //             secondaryEmail={user.userPublicInfos.secondary_email}
        //             next={next}
        //             user={user}
        //         />
        //     );
        // } else if (step === STEP.accountPendingCreation && user) {
        //     stepView = (
        //         <AccountPendingCreationScreen
        //             next={next}
        //             user={user}
        //             getUser={getUser}
        //         />
        //     );
        // } else if (step === STEP.accountCreated && user) {
        stepView = (
            <div>
                <p>
                    Il faut maintenant que {user.userPublicInfos.fullname} se
                    connecte à{" "}
                    <a
                        className="fr-link"
                        href="/account#password"
                        target="_blank"
                    >
                        l'espace-membre
                    </a>{" "}
                    avec son adresse secondaire.
                </p>
                <p>
                    Un fois dans l'espace membre iel doit définir son mot de
                    passe pour son adresse @beta.gouv.fr dans "changer mot de
                    passe".
                </p>
                <button className="button" onClick={() => next()}>
                    Passer à l'étape suivante
                </button>
            </div>
        );
    } else if (step === STEP.everythingIsGood && user) {
        stepView = (
            <div>
                <p>Tout semble réglé pour {user.userPublicInfos.fullname}.</p>
                <button className="button" onClick={resetLocalStorage}>
                    Terminer
                </button>
            </div>
        );
    } else if (step === STEP.emailSuspended && user) {
        stepView = (
            <div>
                <p>
                    La date de fin de mission de {user.userPublicInfos.fullname}{" "}
                    a été mise à jour un peu tard, son email a été suspendu.
                </p>
                <p>
                    Pour le réactiver, iel doit se connecter a{" "}
                    <a
                        className="fr-link"
                        href="/account#password"
                        target="_blank"
                    >
                        l'espace-membre
                    </a>{" "}
                    avec son adresse secondaire. Une fois dans l'espace membre
                    iel doit définir son mot de passe pour son adresse
                    @beta.gouv.fr dans "changer mot de passe".
                </p>
                <p>
                    Iel aura alors de nouveau accès a son email en utilisant ce
                    mdp dans son client email ou sur mail.ovh.net
                </p>
                <Button onClick={() => next()}>
                    Passer à l'étape suivante
                </Button>
            </div>
        );
    } else if (step === STEP.emailBlocked && user) {
        stepView = (
            <div>
                <p>
                    {user.userPublicInfos.fullname} a du faire un envoie massif
                    d'email par gmail, ou depuis de nombreuses ips différentes.
                    Son email a été bloqué par OVH.
                </p>
                <p>
                    Pour le réactiver, iel doit se connecter a{" "}
                    <a
                        className="fr-link"
                        href="/account#password"
                        target="_blank"
                    >
                        l'espace-membre
                    </a>{" "}
                    avec son adresse secondaire. Une fois dans l'espace membre
                    iel doit définir son mot de passe pour son adresse
                    @beta.gouv.fr dans "changer mot de passe".
                </p>
                <p>
                    Iel aura alors de nouveau accès a son email en utilisant ce
                    mdp dans son client email ou sur mail.ovh.net
                </p>
                <Button onClick={() => next()}>
                    Passer à l'étape suivante
                </Button>
            </div>
        );
    } else if (step === STEP.shouldChangedPassword && user) {
        stepView = (
            <div>
                <p>
                    Si {user.userPublicInfos.fullname} n'arrive plus accéder a
                    son email @beta.gouv.fr, iel peut faire un changement de mot
                    de passe.
                </p>
                <p>
                    Il faut que {user.userPublicInfos.fullname} se connecte à{" "}
                    <a
                        className="fr-link"
                        href="/account#password"
                        target="_blank"
                    >
                        l'espace-membre
                    </a>{" "}
                    avec son adresse secondaire.
                </p>
                <p>
                    Un fois dans l'espace membre iel doit définir son mot de
                    passe pour son adresse @beta.gouv.fr dans "changer mot de
                    passe".
                </p>
                <p>
                    Iel aura alors de nouveau accès a son email en utilisant ce
                    mdp dans son client email ou sur mail.ovh.net
                </p>
            </div>
        );
    } else if (step === STEP.hasMattermostProblem) {
        stepView = (
            <div className="keskipasse-mattermost-container">
                <p>Tu as un problème pour te connecter à mattermost :</p>
                <ol>
                    <li>
                        Vérifie que tu es bien sur{" "}
                        <a
                            className="fr-link"
                            href="https://mattermost.incubateur.net"
                            target={"_blank"}
                        >
                            https://mattermost.incubateur.net
                        </a>
                    </li>
                    <li>
                        Si tu as déjà un mot de passe :
                        <ul>
                            <li>
                                Tente de te connecter avec ton mot de passe.{" "}
                                <br />
                                ⚠️ Le mot de passe de ton adresse @beta.gouv.fr
                                et le mot de passe de mattermost sont deux mot
                                de passe différents.
                            </li>
                            <li>
                                Si tu as l'erreur suivante : "La connexion a
                                échoué car le compte a été désactivé", il faut
                                contacter les admins à l'adresse
                                espace-membre@beta.gouv.fr, mettre en copie
                                l'intra de startup et demander une réactivation
                                du compte.
                            </li>
                            <li>
                                Si tu as l'erreur suivante : "Spécifiez une
                                adresse e­­-mail et/ou un mot de passe valide"
                                ou "Trop grand nombre de tentative de
                                connexion", c'est probablement que le mot de
                                passe n'est pas bon, tu peux essayer de faire un
                                renouvellement de mot de passe (voir point
                                suivant)
                            </li>
                        </ul>
                    </li>
                    <li>
                        Si tu n'as pas de mot de passe ou que tu n'arrives
                        toujours pas a te connecter :
                        <ul>
                            <li>
                                Fais un renouvellement de mot de passe :{" "}
                                <a
                                    className="fr-link"
                                    href="https://mattermost.incubateur.net/reset_password"
                                    target={"_blank"}
                                >
                                    https://mattermost.incubateur.net/reset_password
                                </a>
                            </li>
                            <li>
                                Tu devrais recevoir un email pour redéfinir ton
                                mot de passe.
                                <br />
                                ⚠️ L'email est peut-être dans les spams.
                                <br />
                                ⚠️ Si tu utilises gmail, les emails peuvent
                                arriver avec un délai. Pour les récupérer
                                instantanément aller dans Paramètres ⚙️ →
                                comptes et importation → Consulter d'autres
                                comptes de messagerie → Consulter votre
                                messagerie maintenant.
                            </li>
                        </ul>
                    </li>
                    <li>
                        Si le problème n'est toujours pas réglé envoie un email
                        à espace-membre@beta.gouv.fr avec en copie l'intra ou un
                        membre de l'équipe d'animation de beta que tu connais
                    </li>
                </ol>
            </div>
        );
    } else if (step === STEP.waitingForDateToBeUpdated) {
        stepView = (
            <UpdateEndDatePendingScreen
                user={user}
                next={next}
                getUser={getUser}
                pullRequestURL={pullRequestURL}
            />
        );
    } else if (step === STEP.doNotReceivedEmail && user) {
        stepView = (
            <div>
                <p></p>
                <p>
                    1. ⚠️ Verifier si l'email n'est pas dans les les spams.
                    <br />
                    2. ⚠️ Si {user.userPublicInfos.fullname} utilises gmail, les
                    emails peuvent arriver avec un délai. Pour les récupérer
                    instantanément aller dans Paramètres ⚙️ → comptes et
                    importation → Consulter d'autres comptes de messagerie →
                    Consulter votre messagerie maintenant.
                    <br />
                    3. Il peut y avoir un délai de latence entre l'envoie et la
                    réception de l'email, si il s'est passé moins de 20 minutes
                    depuis votre tentative de connexion, attendre 20 minutes et
                    revérifier l'étape 1 et 2.
                </p>
                <p>
                    Si toujours pas d'email, l'email de{" "}
                    {user.userPublicInfos.fullname} est probablement bloqué par
                    brevo notre service d'email. Merci de nous faire part du
                    soucis dans le chat :
                    <br />
                    <br />
                    <Button
                        onClick={() => showLiveChat("doNotReceivedEmail")}
                        disabled={isLiveChatLoading}
                        iconId={
                            isLiveChatLoading ? "ri-loader-2-fill" : undefined
                        }
                        size="large"
                    >
                        Contactez-nous
                    </Button>
                </p>
            </div>
        );
    }
    return (
        <div className="fr-col-12">
            <div className="fr-container fr-background-alt--grey fr-px-md-0 fr-py-10v fr-py-md-14v">
                <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                    <div className="fr-col-12 fr-col-md-9 fr-col-lg-8">
                        <div className="fr-mb-6v">
                            {step !== STEP.whichMember && (
                                <Button
                                    nativeButtonProps={{
                                        onClick: () => goBack(),
                                    }}
                                    priority="secondary"
                                    className="fr-mb-6v"
                                >
                                    Retour
                                </Button>
                            )}
                            {stepView}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
