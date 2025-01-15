import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";
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
                <div
                    className={fr.cx("fr-col-12", "fr-mb-4w")}
                    style={{ display: "flex" }}
                >
                    <h1
                        style={{ flex: " 1 0 auto" }}
                        className={fr.cx("fr-mb-0")}
                    >
                        {incubatorInfos.title}
                    </h1>
                    <Button
                        priority="secondary"
                        linkProps={{
                            href: `/incubators/${incubatorInfos.uuid}/info-form`,
                        }}
                        style={{ float: "right" }}
                    >
                        Modifier la fiche
                    </Button>
                </div>
                <Table
                    headers={["Nom", "Description"]}
                    data={[
                        [
                            "Fiche beta.gouv.fr",
                            <a
                                key="link"
                                href={`https://beta.gouv.fr/incubateurs/${incubatorInfos.ghid}.html`}
                            >
                                {incubatorInfos.ghid}
                            </a>,
                        ],
                        incubatorInfos.contact && [
                            "Contact",
                            <a
                                key="link"
                                href={`mailto:${incubatorInfos.contact}`}
                            >
                                {incubatorInfos.contact}
                            </a>,
                        ],
                        incubatorInfos.owner_id && [
                            "Sponsor",
                            <a
                                key="link"
                                href={`/organizations/${incubatorInfos.owner_id}`}
                            >
                                {incubatorInfos.organization_name}
                            </a>,
                        ],
                        incubatorInfos.github && [
                            "Code source",
                            <a key="link" href={incubatorInfos.github}>
                                {incubatorInfos.github}
                            </a>,
                        ],
                    ].filter((a) => !!a)}
                ></Table>
                {(teams.length && (
                    <>
                        <h2>Équipes</h2>
                        <Table
                            headers={["Nom", "Mission"]}
                            data={teams.map((t) => [
                                <Link key="link" href={`/teams/${t.uuid}`}>
                                    {t.name?.replace(/\s/g, " ")}
                                </Link>,
                                (t.mission && (
                                    <div
                                        key="mission"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                mdParser.render(t.mission) ||
                                                "",
                                        }}
                                    />
                                )) ||
                                    "",
                            ])}
                        />
                    </>
                )) ||
                    null}

                {(startups.length && (
                    <>
                        <h2>Produits numériques</h2>
                        <Table
                            headers={["Nom", "Phase", "Pitch"]}
                            data={startups.map((s) => [
                                <Link key="link" href={`/startups/${s.uuid}`}>
                                    {s.name}
                                </Link>,
                                (s.phase && <BadgePhase phase={s.phase} />) ||
                                    "-",
                                s.pitch,
                            ])}
                        />
                    </>
                )) ||
                    null}
            </div>
        </>
    );
}
