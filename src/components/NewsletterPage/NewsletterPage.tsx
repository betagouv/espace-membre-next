"use client";

import Table from "@codegouvfr/react-dsfr/Table";
import { add } from "date-fns/add";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";
import { startOfWeek } from "date-fns/startOfWeek";

import { newsletterSchemaType } from "@/models/newsletter";

export interface NewsletterPageProps {
    currentNewsletter: newsletterSchemaType;
    newsletters: newsletterSchemaType[];
}

const formatNewsletterTitle = (newsletter) => {
    return newsletter.sent_at
        ? format(newsletter.sent_at, "d MMMM yyyy", { locale: fr })
        : format(
              add(startOfWeek(newsletter.created_at, { weekStartsOn: 1 }), {
                  weeks: 1,
              }),
              "d MMMM yyyy",
              { locale: fr }
          );
};

const formatNewsletter = (newsletter: newsletterSchemaType) => [
    formatNewsletterTitle(newsletter),
    newsletter.sent_at
        ? format(newsletter.sent_at, "dd/MM/yyyy à HH:mm")
        : undefined,
    <a className="fr-link" key="link" href={newsletter.url} target="_blank">
        Lire
    </a>,
];

export default function NewsletterPage({
    currentNewsletter,
    newsletters,
}: NewsletterPageProps) {
    return (
        <>
            <div className="frmb-8v">
                {currentNewsletter && (
                    <div>
                        <h3>
                            Infolettre de la semaine du{" "}
                            {formatNewsletterTitle(currentNewsletter)}
                        </h3>
                        <p>Lien de l'infolettre</p>
                        <a href={currentNewsletter.url} target="_blank">
                            {currentNewsletter.url}
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
                        data={newsletters.map(formatNewsletter)}
                        headers={["Titre", "Date d'envoi", "Lien"]}
                    />
                </div>
            </div>
        </>
    );
}
