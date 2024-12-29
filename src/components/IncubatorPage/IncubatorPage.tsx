import Link from "next/link";

import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";

import { incubatorSchemaType } from "@/models/incubator";

import { getIncubatorStartups } from "@/lib/kysely/queries/incubators";

import MarkdownIt from "markdown-it";
import { BadgePhase } from "../StartupPage/BadgePhase";

const mdParser = new MarkdownIt(/* Markdown-it options */);

export interface IncubatorPageProps {
    incubatorInfos: incubatorSchemaType;
    startups: Awaited<ReturnType<typeof getIncubatorStartups>>;
}

export default function IncubatorPage({
    incubatorInfos,
    startups,
}: IncubatorPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                <h1>
                    {incubatorInfos.title}{" "}
                    <Button
                        style={{ float: "right" }}
                        priority="secondary"
                        linkProps={{
                            href: `/incubators/${incubatorInfos.uuid}/info-form`,
                        }}
                    >
                        Modifier la fiche
                    </Button>
                </h1>
                <p>
                    {/* <span>
                        Fiche GitHub :{" "}
                        <a
                            className="fr-link"
                            target="_blank"
                            href={`https://github.com/betagouv/beta.gouv.fr/blob/master/content/_incubators/${incubatorInfos.ghid}.md`}
                        >
                            {incubatorInfos.title}
                        </a>
                    </span>
                    <br />
                    <span>
                        Repository :{" "}
                        {incubatorInfos.github ? (
                            <a
                                className="fr-link"
                                target="_blank"
                                href={incubatorInfos.github}
                            >
                                {incubatorInfos.github}
                            </a>
                        ) : (
                            "Non renseigné"
                        )}
                    </span>
                    <br /> */}
                    <span>
                        Contact :{" "}
                        {incubatorInfos.contact && (
                            <a href={`mailto:${incubatorInfos.contact}`}>
                                {incubatorInfos.contact}
                            </a>
                        )}
                    </span>
                    <br />
                </p>
            </div>
            <div
                dangerouslySetInnerHTML={{
                    __html: mdParser.render(incubatorInfos.description),
                }}
            />
            <br />
            <br />
            <h2>Produits numériques</h2>
            <Table
                headers={["Nom", "Phase", "Pitch"]}
                data={startups.map((s) => [
                    <Link href={`/startups/${s.uuid}`}>{s.name}</Link>,
                    (s.phase && <BadgePhase phase={s.phase} />) || "-",
                    s.pitch,
                ])}
            />
        </>
    );
}
