import { Formation } from "@/models/formation";
import { formatDateToFrenchTextReadableFormat } from "@/utils/date";
import { Card } from "@codegouvfr/react-dsfr/Card";

export default function FormationCard({ formation }: { formation: Formation }) {
    return (
        <Card
            background
            border
            desc={formation.description}
            enlargeLink
            imageAlt={`${formation.name} image`}
            imageUrl={formation.imageUrl}
            linkProps={{
                href: `/formations/${formation.airtable_id}`,
            }}
            size="medium"
            title={formation.name}
            titleAs="h3"
            endDetail={
                formation.start
                    ? formatDateToFrenchTextReadableFormat(
                          formation.start,
                          true,
                          true
                      )
                    : undefined
            }
        ></Card>
    );
}
