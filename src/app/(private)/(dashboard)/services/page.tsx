import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import community from "@gouvfr/dsfr/dist/artwork/pictograms/environment/human-cooperation.svg";
import locationFrance from "@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg";
import { StaticImageData } from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { match } from "ts-pattern";

import { db } from "@/lib/kysely";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { capitalizeWords } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const service_accounts = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("user_id", "=", session.user.uuid)
        .execute();
    const sentry = service_accounts.find(
        (s) => s.account_type === SERVICES.SENTRY
    );
    const matomo = service_accounts.find(
        (s) => s.account_type === SERVICES.MATOMO
    );
    const mattermost = service_accounts.find(
        (s) => s.account_type === SERVICES.MATTERMOST
    );

    const services = {
        matomo,
        sentry,
        mattermost,
    };
    return (
        <div className={fr.cx("fr-container", "fr-pb-6w")}>
            <h2 className={fr.cx("fr-pt-4w")}>Demandes d'accès outils</h2>
            {Object.values(SERVICES).map((service) => (
                <div
                    key={service}
                    className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}
                >
                    <div className={fr.cx("fr-col-6")}>
                        <Tile
                            small={true}
                            // className={fr.cx("fr-tile--sm")}
                            title={capitalizeWords(service)}
                            desc={match(services[service])
                                .with(
                                    {
                                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
                                    },
                                    () => (
                                        <Badge severity="success">
                                            Compte existant
                                        </Badge>
                                    )
                                )
                                .with(
                                    {
                                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                                    },
                                    () => (
                                        <Badge severity="new">
                                            Compte en cours de creation
                                        </Badge>
                                    )
                                )
                                .with(
                                    {
                                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT,
                                    },
                                    () => (
                                        <Badge severity="new">
                                            Tu as reçu une invitation par email
                                            pour te connecter.
                                        </Badge>
                                    )
                                )
                                .otherwise(() => (
                                    <Badge noIcon>Pas de compte</Badge>
                                ))}
                            orientation="horizontal"
                            noIcon={true}
                            titleAs="h6"
                            imageUrl={(community as StaticImageData).src}
                            linkProps={{
                                href: `/services/${service}`,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
