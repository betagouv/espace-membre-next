import { Table } from "@codegouvfr/react-dsfr/Table";
import MarkdownIt from "markdown-it";

const mdParser = new MarkdownIt(/* Markdown-it options */);

export const StartupDescription = ({ startupInfos }) => {
    return (
        <>
            <Table
                headers={["Nom", "Valeur"]}
                data={[
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
                        <a
                            key="3"
                            href={startupInfos.repository}
                            target="_blank"
                        >
                            {startupInfos.repository}
                        </a>,
                    ],

                    [
                        "Contact",
                        <a key="4" href={`mailto:${startupInfos.contact}`}>
                            {startupInfos.contact}
                        </a>,
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
