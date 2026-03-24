"use client";

export interface NewsletterPageProps {
  contentUrl: string;
}

export default function NewsletterPage({ contentUrl }: NewsletterPageProps) {
  return (
    <div>
      <h2>Infolettre de la communauté beta.gouv.fr</h2>
      {contentUrl ? (
        <p>
          <a
            href={contentUrl}
            target="_blank"
            title="Consulter le document - ouvre une nouvelle fenêtre"
          >
            Consulter le document de l'infolettre
          </a>
        </p>
      ) : (
        <p>Aucun document disponible pour le moment.</p>
      )}
    </div>
  );
}
