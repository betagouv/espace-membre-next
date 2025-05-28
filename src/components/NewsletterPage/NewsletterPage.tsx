"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { add } from "date-fns/add";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";
import { startOfWeek } from "date-fns/startOfWeek";
import { useSession } from "next-auth/react";

import { newsletterSchemaType } from "@/models/newsletter";

export interface NewsletterPageProps {
    currentNewsletter: newsletterSchemaType;
    newsletters: newsletterSchemaType[];
}

const formatNewsletterTitle = (newsletter) => {
    return format(
        newsletter.sent_at || newsletter.publish_at || newsletter.created_at,
        "d MMMM yyyy",
        {
            locale: fr,
        },
    );
};

const formatNewsletter = (newsletter: newsletterSchemaType, isAdmin: boolean) =>
    [
        formatNewsletterTitle(newsletter),
        newsletter.sent_at
            ? format(newsletter.sent_at, "dd/MM/yyyy à HH:mm")
            : undefined,
        <a
            className="fr-link"
            key="link"
            href={newsletter.brevo_url || newsletter.url}
            target="_blank"
            title={`Lire${
                newsletter.sent_at
                    ? ` l'édition du ${format(newsletter.sent_at, "dd/MM/yyyy à HH:mm")}`
                    : ""
            } - ouvre une nouvelle fenêtre`}
        >
            Lire
        </a>,
        isAdmin ? (
            <a
                className="fr-link"
                key="link"
                href={`/admin/newsletters/${newsletter.id}`}
            >
                Editer
            </a>
        ) : null,
    ].filter((obj) => obj);

export default function NewsletterPage({
    currentNewsletter,
    newsletters,
}: NewsletterPageProps) {
    const { data: session, status } = useSession();
    const headers = ["Titre", "Date d'envoi", "Lien"];
    if (session?.user.isAdmin) {
        headers.push("Edit");
    }
    return (
        <>
            <div className="frmb-8v">
                {currentNewsletter && (
                    <div>
                        <h3>
                            Infolettre de la semaine du{" "}
                            {formatNewsletterTitle(currentNewsletter)}
                        </h3>
                        {currentNewsletter.publish_at && (
                            <p>
                                Cette infolettre sera publiée le :{" "}
                                {format(
                                    currentNewsletter.publish_at,
                                    "dd/MM/yyyy à HH:mm",
                                )}
                            </p>
                        )}
                        {session?.user.isAdmin && (
                            <Button
                                size="small"
                                priority="secondary"
                                linkProps={{ href: "/admin/newsletters" }}
                            >
                                Editer la date de publication
                            </Button>
                        )}
                        <br />
                        <br />
                        <p>
                            Lien de l'infolettre :{" "}
                            <a
                                href={
                                    currentNewsletter.brevo_url ||
                                    currentNewsletter.url
                                }
                                target="_blank"
                                title={
                                    (currentNewsletter.publish_at &&
                                        `Lire l'édition du ${format(
                                            currentNewsletter.publish_at,
                                            "dd/MM/yyyy à HH:mm",
                                        )} - ouvre une nouvelle fenêtre`) ||
                                    `Lire la prochaine édition - ouvre une nouvelle fenêtre`
                                }
                            >
                                {currentNewsletter.brevo_url ||
                                    currentNewsletter.url}
                            </a>
                        </p>
                        <p>
                            L'infolettre est mise en forme par l'équipe
                            d'animation (chaque mardi matin) sur la base des
                            contenus proposés par la communauté sur le pad, puis
                            envoyée le mardi à 17h.
                        </p>
                    </div>
                )}
                <div className="panel panel-full-width">
                    <h3>Historique des infolettres</h3>
                    <hr />
                    {newsletters.length == 0 && (
                        <p>Il n'y a pas d'infolettre dans l'historique</p>
                    )}
                    <Table
                        data={newsletters.map((n) =>
                            formatNewsletter(n, !!session?.user.isAdmin),
                        )}
                        headers={headers}
                    />
                </div>
            </div>
        </>
    );
}
