import { ReactNode } from "react";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";

import { Formation } from "@/models/formation";

export default function FormationCard({
    formation,
    isMemberRegistered,
    isMemberOnWaitingList,
}: {
    formation: Formation;
    isMemberRegistered: boolean;
    isMemberOnWaitingList: boolean;
}) {
    let badges: ReactNode[] = [];
    if (isMemberRegistered) {
        if (!isMemberOnWaitingList) {
            badges.push(
                <ul className="fr-badges-group">
                    <li>
                        <Badge severity="success" as="span">
                            Inscrit
                        </Badge>
                    </li>
                </ul>
            );
        } else {
            badges.push(
                <ul className="fr-badges-group">
                    <li>
                        <Badge as="span">Inscrit sur liste d'attente</Badge>
                    </li>
                </ul>
            );
        }
    }
    if (!!formation.isELearning) {
        badges.push(
            <Badge key={"e-learning"} severity="new" as="span">
                E-learning
            </Badge>
        );
    }

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
            imageAlt={``}
            imageUrl={formation.imageUrl || ""}
            linkProps={{
                href: `/formations/${formation.airtable_id}`,
            }}
            start={badges}
            size="medium"
            title={formation.name}
            titleAs="h2"
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
