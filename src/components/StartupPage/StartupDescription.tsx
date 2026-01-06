import { Table } from "@codegouvfr/react-dsfr/Table";
import MarkdownIt from "markdown-it";

import { startupSchemaType } from "@/models/startup";

const mdParser = new MarkdownIt(/* Markdown-it options */);

export const StartupDescription = ({
  startupInfos,
}: {
  startupInfos: startupSchemaType;
}) => {
  return (
    <>
      <Table
        headers={["Nom", "Valeur"]}
        data={[
          [
            "Contact",
            <a key="4" href={`mailto:${startupInfos.contact}`}>
              {startupInfos.contact}
            </a>,
          ],
          startupInfos.link && [
            "URL du produit",
            <a key="1" href={startupInfos.link} target="_blank">
              {startupInfos.link}
            </a>,
          ],
          [
            "Fiche beta.gouv.fr",
            <a
              key="2"
              href={`https://beta.gouv.fr/startups/${startupInfos.ghid}`}
              target="_blank"
            >
              https://beta.gouv.fr/startups/
              {startupInfos.ghid}
            </a>,
          ],
          startupInfos.repository && [
            "Code source",
            <a key="3" href={startupInfos.repository} target="_blank">
              {startupInfos.repository}
            </a>,
          ],
          startupInfos.stats_url && [
            "Statistiques d'usage",
            <a key="5" href={startupInfos.stats_url} target="_blank">
              {startupInfos.stats_url}
            </a>,
          ],
          startupInfos.impact_url && [
            "Matrice d'impact",
            <a key="6" href={startupInfos.impact_url} target="_blank">
              {startupInfos.impact_url}
            </a>,
          ],
          startupInfos.budget_url && [
            "Budget",
            <a key="7" href={startupInfos.budget_url} target="_blank">
              {startupInfos.budget_url}
            </a>,
          ],
          startupInfos.roadmap_url && [
            "Roadmap",
            <a key="8" href={startupInfos.roadmap_url} target="_blank">
              {startupInfos.roadmap_url}
            </a>,
          ],
          startupInfos.dashlord_url && [
            "Rapport DashLord",
            <a key="9" href={startupInfos.dashlord_url} target="_blank">
              {startupInfos.dashlord_url}
            </a>,
          ],
          startupInfos.ecodesign_url && [
            "Déclaration d'écoconception",
            <a key="11" href={startupInfos.ecodesign_url} target="_blank">
              {startupInfos.ecodesign_url}
            </a>,
          ],
          startupInfos.techno &&
            startupInfos.techno.length && [
              "Technologies",
              startupInfos.techno.join(", "),
            ],
        ].filter((x) => !!x)}
      />
      <div
        dangerouslySetInnerHTML={{
          __html: mdParser.render(startupInfos.description),
        }}
      />
    </>
  );
};
