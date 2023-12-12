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
import Input from "@codegouvfr/react-dsfr/Input";
import { EmailInfos } from "@/models/member";
import Table from "@codegouvfr/react-dsfr/Table";

function BlocEmailConfiguration({ emailInfos }: { emailInfos: EmailInfos }) {
    interface ServerConf {
        server: string;
        method: string;
        port: string;
    }
    enum EmailPlan {
        pro = "pro",
        exchange = "exchange",
        mx = "mx",
    }
    const conf: { [key in EmailPlan]: { smtp: ServerConf; imap: ServerConf } } =
        {
            pro: {
                smtp: {
                    server: "pro1.mail.ovh.net",
                    method: "TLS",
                    port: "587",
                },
                imap: {
                    server: "pro1.mail.ovh.net",
                    method: "SSL",
                    port: "993",
                },
            },
            exchange: {
                smtp: {
                    server: "ex3.mail.ovh.fr",
                    method: "TLS",
                    port: "587",
                },
                imap: {
                    server: "ex3.mail.ovh.net",
                    method: "SSL",
                    port: "993",
                },
            },
            mx: {
                smtp: {
                    server: "ssl0.ovh.net",
                    method: "TLS",
                    port: "587",
                },
                imap: {
                    server: "ssl0.ovh.net",
                    method: "SSL",
                    port: "993",
                },
            },
        };
    let plan = "mx";
    if (emailInfos.isPro) {
        plan = "pro";
    } else if (emailInfos.isExchange) {
        plan = "exchange";
    }
    return (
        <Accordion label="Configurer ton email beta">
            <p>
                Configure ton client mail préféré (Mail, Thunderbird,
                Mailspring, Microsoft Courier, Gmail, etc) pour recevoir et
                envoyer des emails. D'avantage d'info ici :{" "}
                <a
                    href="https://doc.incubateur.net/communaute/travailler-a-beta-gouv/jutilise-les-outils-de-la-communaute/emails/envoyer-et-recevoir-des-mails-beta.gouv.fr"
                    target="_blank"
                    className="button no-margin"
                >
                    documentation de configuration du webmail
                </a>
            </p>
            {["imap", "smtp"].map((confType) => (
                <>
                    <b>{confType} : </b>
                    <Table
                        data={[
                            ["Serveur", conf[plan][confType].server],
                            ["Port", conf[plan][confType].port],
                            [
                                "Méthode de chiffrement",
                                conf[plan][confType].method,
                            ],
                            [`Nom d'utilisateur`, emailInfos.email],
                            ["Mot de passe", "Le mot de passe de ton email"],
                        ]}
                        headers={["Paramètre", "Valeur"]}
                    />
                </>
            ))}
        </Accordion>
    );
}

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
                <BlocEmailConfiguration emailInfos={emailInfos} />
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
