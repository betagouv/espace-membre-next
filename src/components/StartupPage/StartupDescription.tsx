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
