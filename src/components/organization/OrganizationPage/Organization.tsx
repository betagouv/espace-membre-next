import Link from "next/link";

import { fr } from "@codegouvfr/react-dsfr";
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
                <div
                    className={fr.cx("fr-col-12", "fr-mb-4w")}
                    style={{ display: "flex" }}
                >
                    <h1
                        style={{ flex: " 1 0 auto" }}
                        className={fr.cx("fr-mb-0")}
                    >
                        {organizationInfos.name}
                    </h1>
                    <Button
                        priority="secondary"
                        linkProps={{
                            href: `/organizations/${organizationInfos.uuid}/info-form`,
                        }}
                        style={{ float: "right" }}
                    >
                        Modifier la fiche
                    </Button>
                </div>
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
