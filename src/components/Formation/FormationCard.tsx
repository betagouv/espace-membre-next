import { Formation } from "@/models/formation";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";

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
                    ? format(formation.start, "d MMMM à HH'h'mm", {
                          locale: fr,
                      })
                    : undefined
            }
        ></Card>
    );
}
