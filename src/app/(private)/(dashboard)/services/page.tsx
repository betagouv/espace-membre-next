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

    return (
        <div className={fr.cx("fr-container", "fr-pb-6w")}>
            <h2 className={fr.cx("fr-pt-4w")}>
                Demandes d'accès outils {service_accounts.length}
            </h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-6")}>
                    <Tile
                        small={true}
                        // className={fr.cx("fr-tile--sm")}
                        title="Matomo"
                        desc={match(matomo)
                            .with(
                                {
                                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
                                },
                                () => (
                                    <Badge noIcon severity="success">
                                        Compte existant
                                    </Badge>
                                )
                            )
                            .with(
                                {
                                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                                },
                                () => (
                                    <Badge noIcon severity="info">
                                        Compte en cours de creation
                                    </Badge>
                                )
                            )
                            .otherwise(() => (
                                <Badge noIcon severity="info">
                                    Pas de compte
                                </Badge>
                            ))}
                        orientation="horizontal"
                        noIcon={true}
                        titleAs="h6"
                        imageUrl={(community as StaticImageData).src}
                        disabled={false}
                        linkProps={{
                            href: `/services/matomo`,
                        }}
                    />
                </div>
            </div>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-6")}>
                    <Tile
                        small={true}
                        className={fr.cx("fr-tile--sm")}
                        title="Sentry"
                        desc={match(sentry)
                            .with(
                                {
                                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
                                },
                                () => (
                                    <Badge noIcon severity="success">
                                        Compte existant
                                    </Badge>
                                )
                            )
                            .with(
                                {
                                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                                },
                                () => (
                                    <Badge noIcon severity="info">
                                        Compte en cours de creation
                                    </Badge>
                                )
                            )
                            .otherwise(() => (
                                <Badge noIcon severity="info">
                                    Pas de compte
                                </Badge>
                            ))}
                        orientation="horizontal"
                        imageUrl={(locationFrance as StaticImageData).src}
                        linkProps={{
                            href: `/admin/newsletters`,
                        }}
                    />
                </div>
            </div>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-6")}>
                    <Tile
                        small={true}
                        className={fr.cx("fr-tile--sm")}
                        title="Sentry"
                        desc={match(mattermost)
                            .with(
                                {
                                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
                                },
                                () => (
                                    <Badge noIcon severity="success">
                                        Compte existant
                                    </Badge>
                                )
                            )
                            .with(
                                {
                                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                                },
                                () => (
                                    <Badge noIcon severity="info">
                                        Compte en cours de creation
                                    </Badge>
                                )
                            )
                            .otherwise(() => (
                                <Badge noIcon severity="info">
                                    Pas de compte
                                </Badge>
                            ))}
                        orientation="horizontal"
                        imageUrl={(locationFrance as StaticImageData).src}
                        linkProps={{
                            href: `/admin/newsletters`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
