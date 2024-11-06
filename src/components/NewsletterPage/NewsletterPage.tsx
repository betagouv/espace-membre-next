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
        }
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
                                    "dd/MM/yyyy à HH:mm"
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
                        <p>Lien de l'infolettre : </p>
                        <a
                            href={
                                currentNewsletter.brevo_url ||
                                currentNewsletter.url
                            }
                            target="_blank"
                        >
                            {currentNewsletter.brevo_url ||
                                currentNewsletter.url}
                        </a>

                        <br />
                        <p>
                            L'infolettre est lue et partagée pendant l'hebdo
                            beta.gouv (chaque jeudi à 12h) puis envoyée après
                            validation à partir de jeudi 18h
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
                            formatNewsletter(n, !!session?.user.isAdmin)
                        )}
                        headers={headers}
                    />
                </div>
            </div>
        </>
    );
}
