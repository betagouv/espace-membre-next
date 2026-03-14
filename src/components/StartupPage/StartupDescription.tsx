import { Table } from "@codegouvfr/react-dsfr/Table";
import MarkdownIt from "markdown-it";

import { StartupUrlRow } from "./StartupPage";
import { STARTUP_URL_TYPE_LABELS, startupSchemaType } from "@/models/startup";

const mdParser = new MarkdownIt(/* Markdown-it options */);

export const StartupDescription = ({
  startupInfos,
  startupUrls,
}: {
  startupInfos: startupSchemaType;
  startupUrls: StartupUrlRow[];
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
          ...startupUrls
            .filter((u) => u.url)
            .map((u, i) => [
              u.label ||
                STARTUP_URL_TYPE_LABELS[
                  u.type as keyof typeof STARTUP_URL_TYPE_LABELS
                ] ||
                u.type,
              <a key={`url-${i}`} href={u.url} target="_blank">
                {u.url}
              </a>,
            ]),
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
