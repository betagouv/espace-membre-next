import Link from "next/link";

import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import { sponsorSchemaType } from "@/models/sponsor";
import { getOrganizationStartups } from "@/lib/kysely/queries/organizations";

import { BadgePhase } from "../../StartupPage/BadgePhase";

export interface OrganizationPageProps {
    organizationInfos: sponsorSchemaType;
    startups: Awaited<ReturnType<typeof getOrganizationStartups>>;
}

export default function OrganizationPage({
    organizationInfos,
    startups,
}: OrganizationPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                <h1>
                    {organizationInfos.name}{" "}
                    <Button
                        linkProps={{
                            href: `/organizations/${organizationInfos.uuid}/info-form`,
                        }}
                        style={{ float: "right" }}
                        priority="secondary"
                    >
                        Modifier la fiche
                    </Button>
                </h1>
                <p>
                    <span>Acronyme : {organizationInfos.acronym}</span>
                    <br />
                    <span>
                        Domaine ministeriel :{" "}
                        {organizationInfos.domaine_ministeriel}
                    </span>
                    <br />
                    <span>Type de sponsor : {organizationInfos.type}</span>
                    <br />
                </p>
            </div>
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
        </>
    );
}
