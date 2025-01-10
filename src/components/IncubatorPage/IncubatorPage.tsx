import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
import { incubatorSchemaType } from "@/models/incubator";

import {
    getIncubatorStartups,
    getIncubatorTeams,
} from "@/lib/kysely/queries/incubators";

import Table from "@codegouvfr/react-dsfr/Table";

import MarkdownIt from "markdown-it";
import { BadgePhase } from "../StartupPage/BadgePhase";

const mdParser = new MarkdownIt({
    html: true,
});

export interface IncubatorPageProps {
    incubatorInfos: incubatorSchemaType;
    teams: Awaited<ReturnType<typeof getIncubatorTeams>>;
    startups: Awaited<ReturnType<typeof getIncubatorStartups>>;
}

export default function IncubatorPage({
    incubatorInfos,
    startups,
    teams,
}: IncubatorPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                <h1>
                    {incubatorInfos.title}
                    <Button
                        linkProps={{
                            href: `/incubators/${incubatorInfos.uuid}/info-form`,
                        }}
                        priority="secondary"
                        style={{ float: "right" }}
                    >
                        Modifier la fiche
                    </Button>
                </h1>
                <Table
                    headers={["Nom", "Description"]}
                    data={[
                        [
                            "Fiche beta.gouv.fr",
                            <a
                                href={`https://beta.gouv.fr/incubateurs/${incubatorInfos.ghid}.html`}
                            >
                                {incubatorInfos.ghid}
                            </a>,
                        ],
                        incubatorInfos.contact && [
                            "Contact",
                            <a href={`mailto:${incubatorInfos.contact}`}>
                                {incubatorInfos.contact}
                            </a>,
                        ],
                        incubatorInfos.owner_id && [
                            "Sponsor",
                            <a
                                href={`/organizations/${incubatorInfos.owner_id}`}
                            >
                                {incubatorInfos.organization_name}
                            </a>,
                        ],
                        incubatorInfos.github && [
                            "Code source",
                            <a href={incubatorInfos.github}>
                                {incubatorInfos.github}
                            </a>,
                        ],
                    ].filter((a) => !!a)}
                ></Table>
                <h2>Équipes</h2>
                <Table
                    headers={["Nom", "Mission"]}
                    data={teams.map((t) => [
                        <Link key="link" href={`/teams/${t.uuid}`}>
                            {t.name?.replace(/\s/g, " ")}
                        </Link>,
                        <div
                            dangerouslySetInnerHTML={{
                                __html: mdParser.render(t.mission),
                            }}
                        />,
                    ])}
                />
                <h2>Produits numériques</h2>
                <Table
                    headers={["Nom", "Phase", "Pitch"]}
                    data={startups.map((s) => [
                        <Link key="link" href={`/startups/${s.uuid}`}>
                            {s.name}
                        </Link>,
                        (s.phase && <BadgePhase phase={s.phase} />) || "-",
                        s.pitch,
                    ])}
                />
            </div>
        </>
    );
}
