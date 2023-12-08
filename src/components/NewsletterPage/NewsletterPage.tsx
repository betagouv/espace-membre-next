"use client";

export interface NewsletterPageProps {
    currentNewsletter: any;
    newsletters: any;
}

export default function NewsletterPage({
    currentNewsletter,
    newsletters,
}: NewsletterPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                {currentNewsletter && (
                    <div>
                        <h3>
                            Infolettre de la semaine du{" "}
                            {currentNewsletter.title}
                        </h3>
                        <p>Lien de l'infolettre</p>
                        <a href="<%= currentNewsletter.url %>" target="_blank">
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
                    {newsletters.length && (
                        <p>Il n'y a pas d'infolettres dans l'historique</p>
                    )}
                    <table className="sortable">
                        <tbody>
                            {newsletters.map((newsletter) => (
                                <tr>
                                    <td>
                                        <b>{newsletter.title}</b>
                                    </td>
                                    <td>
                                        {newsletter.sent_at && (
                                            <>
                                                Envoyée le {newsletter.sent_at},
                                                validée par{" "}
                                                {newsletter.validator ||
                                                    "membre non renseigné"}{" "}
                                            </>
                                        )}
                                        {!newsletter.sent_at && (
                                            <>non envoyée</>
                                        )}
                                    </td>
                                    <td>
                                        <a
                                            href={newsletter.url}
                                            target="_blank"
                                        >
                                            Lire
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
