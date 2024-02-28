import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";

import { Formation } from "@/models/formation";

export default function FormationCard({
    formation,
    isMemberRegistered,
}: {
    formation: Formation;
    isMemberRegistered: boolean;
}) {
    return (
        <Card
            background
            border
            desc={
                <span
                    style={{
                        overflowWrap: "break-word",
                    }}
                >
                    {formation.description}
                </span>
            }
            enlargeLink
            imageAlt={`${formation.name} image`}
            imageUrl={formation.imageUrl}
            linkProps={{
                href: `/formations/${formation.airtable_id}`,
            }}
            badges={
                !!formation.isELearning
                    ? [
                          <Badge key={"e-learning"} severity="new">
                              E-learning
                          </Badge>,
                      ]
                    : undefined
            }
            start={
                isMemberRegistered ? (
                    <ul className="fr-badges-group">
                        <li>
                            <Badge severity="success">Inscrit</Badge>
                        </li>
                    </ul>
                ) : undefined
            }
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
