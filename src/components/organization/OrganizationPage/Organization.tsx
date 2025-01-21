import Link from "next/link";

import Table from "@codegouvfr/react-dsfr/Table";
import { sponsorSchemaType } from "@/models/sponsor";
import {
    getOrganizationStartups,
    getOrganizationIncubators,
} from "@/lib/kysely/queries/organizations";

import { BadgePhase } from "../../StartupPage/BadgePhase";
import { FicheHeader } from "@/components/FicheHeader";

export interface OrganizationPageProps {
    organizationInfos: sponsorSchemaType;
    startups: Awaited<ReturnType<typeof getOrganizationStartups>>;
    incubators: Awaited<ReturnType<typeof getOrganizationIncubators>>;
}

export default function OrganizationPage({
    organizationInfos,
    startups,
    incubators,
}: OrganizationPageProps) {
    return (
        <>
            <div className="fr-mb-8v">
                <FicheHeader
                    label={organizationInfos.name}
                    editLink={`/organizations/${organizationInfos.uuid}/info-form`}
                />
                <br />
                <Table
                    headers={["Nom", "Description"]}
                    data={[
                        ["Acronyme", organizationInfos.acronym],
                        ["Type de sponsor", organizationInfos.type],
                        [
                            "Domaine ministeriel",
                            organizationInfos.domaine_ministeriel,
                        ],
                    ]}
                />
            </div>
            {incubators.length ? (
                <>
                    <h2>Incubateurs de services numériques</h2>
                    <Table
                        headers={["Nom", "Description"]}
                        data={incubators.map((i) => [
                            <Link key="link" href={`/incubators/${i.uuid}`}>
                                {i.title}
                            </Link>,
                            i.short_description,
                        ])}
                    />
                </>
            ) : null}
            {startups.length ? (
                <>
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
            ) : null}
        </>
    );
}
