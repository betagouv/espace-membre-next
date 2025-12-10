import { fr } from "@codegouvfr/react-dsfr/fr";

import { startupSchemaType } from "@/models/startup";

import "./standards.css";

const LinkItem = ({ label, url }: { label: string; url?: string | null }) => {
  if (!url) {
    return null;
  }
  return (
    <li className={fr.cx("fr-mb-2w")}>
      <strong>{label}:</strong>{" "}
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    </li>
  );
};

export const StartupLinks = ({
  startupInfos,
}: {
  startupInfos: startupSchemaType;
}) => {
  const hasAnyLink =
    startupInfos.link ||
    startupInfos.repository ||
    startupInfos.dashlord_url ||
    startupInfos.stats_url ||
    startupInfos.budget_url ||
    startupInfos.tech_audit_url ||
    startupInfos.roadmap_url ||
    startupInfos.ecodesign_url ||
    startupInfos.impact_url;

  return (
    <>
      <h2>Liens</h2>
      {!hasAnyLink && (
        <p className={fr.cx("fr-text--sm")}>
          Aucun lien n'a été renseigné pour cette startup.
        </p>
      )}
      <ul className={fr.cx("fr-raw-list")}>
        <LinkItem label="Site web" url={startupInfos.link} />
        <LinkItem label="Code source" url={startupInfos.repository} />
        <LinkItem
          label="Statistiques d'usage"
          url={startupInfos.stats_url}
        />
        <LinkItem
          label="Statistiques d'impact"
          url={startupInfos.impact_url}
        />
        <LinkItem label="Budget" url={startupInfos.budget_url} />
        <LinkItem label="Roadmap" url={startupInfos.roadmap_url} />
        <LinkItem label="Rapport DashLord" url={startupInfos.dashlord_url} />
        <LinkItem label="Audit technique" url={startupInfos.tech_audit_url} />
        <LinkItem
          label="Déclaration d'écoconception"
          url={startupInfos.ecodesign_url}
        />
      </ul>
    </>
  );
};
