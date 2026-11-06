import { Table } from "@codegouvfr/react-dsfr/Table";
import MarkdownIt from "markdown-it";

import { startupSchemaType } from "@/models/startup";
import {
  isHttpUrl,
  STARTUP_URL_TYPE_LABELS,
  StartupUrl,
} from "@/models/startupUrl";

const mdParser = new MarkdownIt(/* Markdown-it options */);

export const StartupDescription = ({
  startupInfos,
  startupUrls,
}: {
  startupInfos: startupSchemaType;
  startupUrls: StartupUrl[];
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
          ...startupUrls.map((startupUrl, index) => [
            startupUrl.label
              ? `${STARTUP_URL_TYPE_LABELS[startupUrl.type]} : ${startupUrl.label}`
              : STARTUP_URL_TYPE_LABELS[startupUrl.type],
            isHttpUrl(startupUrl.url) ? (
              <a key={`url-${index}`} href={startupUrl.url} target="_blank">
                {startupUrl.url}
              </a>
            ) : (
              startupUrl.url
            ),
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
