import React from "react";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import BlocAccederAuWebmail from "./BlocAccederAuWebmail";
import BlocChangerMotDePasse from "./BlocChangerMotDePasse";
import BlocConfigurerCommunicationEmail from "./BlocConfigurerCommunicationEmail";
import BlocConfigurerEmailPrincipal from "./BlocConfigurerEmailPrincipal";
import BlocConfigurerEmailSecondaire from "./BlocConfigurerEmailSecondaire";
import BlocRedirection from "./BlocRedirection";
import BlocEmailResponder from "./BlocEmailResponder";
import { fr } from "@codegouvfr/react-dsfr";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";

export default function EmailContainer({
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
    communication_email,
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
}) {
    return (
        <div className="fr-mb-14v">
            <h2>Email</h2>
            <p>
                {emailInfos && (
                    <>
                        <span className="font-weight-bold">
                            Email principal :{" "}
                        </span>
                        <span className="font-weight-bold text-color-blue">
                            {emailInfos.email}
                            {emailInfos.isPro && `(offre OVH Pro)`}
                            {emailInfos.isExchange && `(offre OVH Exchange)`}
                        </span>
                        <br />
                    </>
                )}
                {!emailInfos &&
                    primaryEmail &&
                    !primaryEmail.includes(domain) && (
                        <>
                            <span className="font-weight-bold">
                                Email principal :{" "}
                            </span>
                            <span className="font-weight-bold text-color-blue">
                                {primaryEmail}
                            </span>
                            <br />
                        </>
                    )}
                <span className="font-weight-bold">Email secondaire : </span>{" "}
                {secondaryEmail || "Non renseigné"}
            </p>
            <div className={fr.cx("fr-accordions-group")}>
                {Boolean(
                    isAdmin &&
                        availableEmailPros.length &&
                        emailInfos &&
                        !emailInfos.isPro &&
                        !emailInfos.isExchange
                ) && (
                    <>
                        <p>
                            Il y a {availableEmailPros.length} comptes
                            disponibles.
                        </p>
                        <p>Passer ce compte en pro : </p>
                        <form
                            className="no-margin"
                            onSubmit={(e) => {
                                e.preventDefault();
                                axios.post(
                                    computeRoute(
                                        routes.USER_UPGRADE_EMAIL
                                    ).replace(":username", userInfos.id)
                                );
                            }}
                        >
                            <label>
                                <span className="text-color-almost-black">
                                    Un mot de passe pour ton compte
                                </span>
                                <br />
                            </label>
                            <input
                                name="password"
                                type="password"
                                required
                                min="8"
                            />
                            <button className="button no-margin" type="submit">
                                Upgrader en compte pro
                            </button>
                        </form>
                        <br />
                        <br />
                    </>
                )}
                {canCreateEmail && (
                    <>
                        <p>Tu peux créer ton compte email @beta.gouv.fr.</p>
                        {hasPublicServiceEmail &&
                            `Attention tu as une adresse de service public en adresse primaire. Si tu créés une adresse @beta.gouv.fr, elle deviendra ton adresse primaire :
                    celle à utiliser pour mattermost, et d'autres outils.`}
                        <form
                            className="no-margin"
                            onSubmit={() => {
                                axios.post(
                                    computeRoute(
                                        routes.USER_CREATE_EMAIL_API
                                    ).replace(":username", userInfos.id),
                                    undefined,
                                    {
                                        withCredentials: true,
                                    }
                                );
                            }}
                        >
                            <div className="form__group  margin-10-0">
                                <label>
                                    <span className="text-color-almost-black">
                                        Email personnel ou professionnel
                                    </span>
                                    <br />
                                    Les informations de connexion seront
                                    envoyées à cet email
                                </label>
                                <input
                                    value="<%= secondaryEmail %>"
                                    name="to_email"
                                    type="email"
                                    required
                                />
                            </div>
                            <button className="button no-margin" type="submit">
                                Créer un compte
                            </button>
                        </form>
                        <br />
                        <br />
                    </>
                )}
                <Accordion label="Configurer ton email beta">
                    <p>
                        Configure ton client mail préféré (Mail, Thunderbird,
                        Mailspring, Microsoft Courier, Gmail, etc) pour recevoir
                        et envoyer des emails :
                    </p>
                    <a
                        href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/jutilise-les-outils-de-la-communaute/emails#envoyer-et-recevoir-des-mails-beta.gouv.fr"
                        target="_blank"
                        className="button no-margin"
                    >
                        Documentation de configuration du webmail
                    </a>
                </Accordion>
                <BlocEmailResponder
                    username={userInfos.id}
                    hasResponder={hasResponder}
                    responderFormData={responderFormData}
                />
                <BlocChangerMotDePasse
                    canChangePassword={canChangePassword}
                    emailSuspended={emailSuspended}
                    userInfos={userInfos}
                />
                <BlocAccederAuWebmail />
                <BlocRedirection
                    redirections={redirections}
                    canCreateRedirection={canCreateRedirection}
                    userInfos={userInfos}
                    isExpired={isExpired}
                    domain={domain}
                />
                <BlocConfigurerEmailPrincipal
                    canChangeEmails={canChangeEmails}
                    userInfos={userInfos}
                    primaryEmail={primaryEmail}
                />
                <BlocConfigurerEmailSecondaire
                    canChangeEmails={canChangeEmails}
                    secondaryEmail={secondaryEmail}
                />
                <BlocConfigurerCommunicationEmail
                    primaryEmail={primaryEmail}
                    secondaryEmail={secondaryEmail}
                    communication_email={communication_email}
                />
            </div>
        </div>
    );
}
