"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import axios from "axios";

import EmailContainer from "./EmailContainer";
import FicheMembre from "./FicheMembre";
import Observatoire from "./Observatoire";
import { EmailStatusCode } from "@/models/dbUser";
import {
    memberSchemaType,
    memberSchema,
    EmailInfos,
    memberWrapperSchemaType,
} from "@/models/member";
import { OvhRedirection, OvhResponder } from "@/models/ovh";
import routes, { computeRoute } from "@/routes/routes";
import { routeTitles } from "@/utils/routes/routeTitles";

type AccountPageProps = {
    isExpired: memberWrapperSchemaType["isExpired"];
    userInfos: memberWrapperSchemaType["member"];
    emailInfos: memberWrapperSchemaType["emailInfos"] | null;
    emailRedirections: memberWrapperSchemaType["emailRedirections"];
    emailResponder: memberWrapperSchemaType["emailResponder"] | null;
    authorizations: memberWrapperSchemaType["authorizations"];
};

export default function AccountPage(props: AccountPageProps) {
    const {
        emailResponder,
        isExpired,
        userInfos: {
            workplace_insee_code,
            osm_city,
            gender,
            legal_status,
            tjm,
            average_nb_of_days,
            primary_email_status,
        },
        authorizations,
        emailInfos,
        emailRedirections,
    } = props;

    const hasActiveResponder =
        emailResponder &&
        emailResponder?.from > new Date() &&
        emailResponder?.to < new Date();
    return (
        <div>
            {hasActiveResponder && (
                <div className="notification warning">
                    <strong>Réponse automatique activée.</strong>
                    <a href="/account#responder">Désactiver maintenant</a>
                    <a href="/account#responder">Configurer la réponse</a>
                </div>
            )}
            {[
                EmailStatusCode.EMAIL_CREATION_WAITING,
                EmailStatusCode.EMAIL_CREATION_PENDING,
            ].includes(primary_email_status) && (
                <Alert
                    title={"Bienvenue"}
                    closable={true}
                    description={
                        <>
                            <p>
                                Ton email @beta.gouv.fr est en train d'être
                                créé, tu recevras un email dans quelques
                                instants t'informant qu'il est désormais actif.
                            </p>
                            <p>
                                Tu pourras alors définir ton mot de passe dans
                                cette page plus bas, et tu recevras les
                                informations pour te connecter à mattermost
                                notre outil de chat.
                            </p>
                        </>
                    }
                    severity="info"
                    className={fr.cx("fr-mb-4w")}
                />
            )}
            {[
                EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
            ].includes(primary_email_status) && (
                <Alert
                    title={"Bienvenue"}
                    closable={true}
                    description={
                        <>
                            <p>
                                Ton email @beta.gouv.fr est créé, il faut
                                maintenant définir le mot de passe dans la
                                section :{" "}
                                <a href="#password">Définir mon mot de passe</a>
                            </p>
                        </>
                    }
                    severity="success"
                    className={fr.cx("fr-mb-4w")}
                />
            )}
            <h1>{routeTitles.account()}</h1>
            {props.userInfos && (
                <>
                    <FicheMembre userInfos={props.userInfos}></FicheMembre>
                    <EmailContainer
                        isExpired={isExpired}
                        emailInfos={emailInfos}
                        emailResponder={emailResponder}
                        emailRedirections={emailRedirections}
                        userInfos={props.userInfos}
                        authorizations={authorizations}
                    ></EmailContainer>
                    <Observatoire
                        average_nb_of_days={average_nb_of_days}
                        workplace_insee_code={workplace_insee_code}
                        osm_city={osm_city}
                        gender={gender}
                        tjm={tjm}
                        legal_status={legal_status}
                    />
                </>
            )}
            <div className="fr-mb-14v">
                <h2>Besoin d'aide ?</h2>
                <ButtonsGroup
                    buttons={[
                        {
                            children: "Voir la documentation",
                            linkProps: {
                                href: "https://doc.incubateur.net/",
                            },
                        },
                    ]}
                    inlineLayoutWhen="md and up"
                />
            </div>
            {(emailInfos ||
                (emailRedirections && emailRedirections.length > 0)) && (
                <div className="fr-mb-14v">
                    <h2>❗ Clôturer mon compte</h2>
                    <p>
                        Si tu as quitté la communauté, clôture ton compte, ce
                        qui aura pour effet de :
                    </p>
                    <ul>
                        <li>Supprimer ton compte email</li>
                        <li>Supprimer toutes tes redirections</li>
                        <li>
                            Rediriger d'éventuels emails vers
                            depart@beta.gouv.fr, ce qui enverra une réponse
                            automatique à l'expéditeur pour l'informer que le
                            compte n'existe plus.
                        </li>
                    </ul>
                    <form
                        onSubmit={() => {
                            if (
                                confirm(
                                    "Es-tu sûr de vouloir supprimer ton compte email et toutes ses redirections ? "
                                )
                            ) {
                                axios.post(
                                    computeRoute(
                                        routes.USER_DELETE_EMAIL_API.replace(
                                            ":username",
                                            id
                                        )
                                    ),
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
                                iconId="fr-icon-warning-line"
                                nativeButtonProps={{
                                    type: "submit",
                                }}
                            >
                                Clôturer mon compte
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
