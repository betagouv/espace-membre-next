import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Table } from "@codegouvfr/react-dsfr/Table";

export const StartupTools = ({ matomoSites, sentryTeams }) => {
  return (
    <div className="fr-mb-4v">
      <h2>Outils</h2>
      <Accordion
        label="Matomo"
        expanded={true}
        titleAs="h3"
        onExpandedChange={(expanded, e) => {}}
      >
        {!matomoSites.length && (
          <p>Aucun site matomo n'est connecté à ce produit</p>
        )}
        {!!matomoSites.length && (
          <Table
            data={matomoSites.map((site) => [site.name, site.url, site.type])}
            headers={["nom du site", "url", "type"]}
          ></Table>
        )}
      </Accordion>
      <Accordion
        label="Sentry"
        expanded={true}
        titleAs="h3"
        onExpandedChange={(expanded, e) => {}}
      >
        {!sentryTeams.length && (
          <p>Aucun équipe sentry n'est connecté à ce produit</p>
        )}
        {!!sentryTeams.length && (
          <Table
            data={sentryTeams.map((site) => [site.name])}
            headers={["nom de l'équipe"]}
          ></Table>
        )}
      </Accordion>
    </div>
  );
};
