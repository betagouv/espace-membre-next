"use client";
import React from "react";
import routes from "@/routes/routes";
import axios from "axios";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import FicheMembre from "./FicheMembre";
import EmailContainer from "./EmailContainer";
import Observatoire from "./Observatoire";

export default (props: any) => {
    const {
        updatePullRequest,
        hasActiveResponder,
        userInfos,
        workplace,
        gender,
        emailInfos,
        primaryEmail,
        canCreateEmail,
        canCreateRedirection,
        hasPublicServiceEmail,
        legal_status,
        availableEmailPros,
        secondaryEmail,
        domain,
        tjm,
        average_nb_of_days,
        isAdmin,
        hasResponder,
        canChangeEmails,
        canChangePassword,
        emailSuspended,
        marrainageState,
        redirections,
        isExpired,
        responderFormData,
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
                        {
                            children: "Contacter l'équipe support",
                            linkProps: {
                                href: "#",
                            },
                            priority: "secondary",
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
                                routes.USER_DELETE_EMAIL.replace(
                                    ":username",
                                    userInfos.id
                                )
                            );
                        }}
                        className="no-margin"
                    >
                        <div className="form__group">
                            <button
                                className="button margin-right-10"
                                type="submit"
                            >
                                Clôturer mon compte
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
