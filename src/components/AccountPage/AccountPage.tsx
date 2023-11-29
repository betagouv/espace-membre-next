"use client";
import React from "react";
import routes, { computeRoute } from "@/routes/routes";
import axios from "axios";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import FicheMembre from "./FicheMembre";
import EmailContainer from "./EmailContainer";
import Observatoire from "./Observatoire";
import Button from "@codegouvfr/react-dsfr/Button";
import { routeTitles } from "@/utils/routes/routeTitles";

export default function AccountPage(props: any) {
    const {
        updatePullRequest,
        hasActiveResponder,
        userInfos,
        workplace,
        gender,
        emailInfos,
        legal_status,
        tjm,
        average_nb_of_days,
        redirections,
    } = props;
    return (
        <div>
            {hasActiveResponder && (
                <div className="notification warning">
                    <strong>Réponse automatique activée.</strong>
                    <a href="/account#responder">Désactiver maintenant</a>
                    <a href="/account#responder">Configurer la réponse</a>
                </div>
            )}
            <h1>{routeTitles.account()}</h1>
            {userInfos && (
                <>
                    <FicheMembre
                        userInfos={userInfos}
                        updatePullRequest={updatePullRequest}
                    ></FicheMembre>
                    <EmailContainer {...props}></EmailContainer>
                    <Observatoire
                        average_nb_of_days={average_nb_of_days}
                        workplace={workplace}
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
            {(emailInfos || (redirections && redirections.length > 0)) && (
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
                            axios.post(
                                computeRoute(
                                    routes.USER_DELETE_EMAIL_API.replace(
                                        ":username",
                                        userInfos.id
                                    )
                                ),
                                undefined,
                                {
                                    withCredentials: true,
                                }
                            );
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
