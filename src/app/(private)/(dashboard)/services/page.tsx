import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import coding from "@gouvfr/dsfr/dist/artwork/pictograms/digital/coding.svg";
import dataviz from "@gouvfr/dsfr/dist/artwork/pictograms/digital/data-visualization.svg";
import community from "@gouvfr/dsfr/dist/artwork/pictograms/environment/human-cooperation.svg";
import locationFrance from "@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg";
import error from "@gouvfr/dsfr/dist/artwork/pictograms/system/error.svg";
import information from "@gouvfr/dsfr/dist/artwork/pictograms/system/information.svg";
import errortech from "@gouvfr/dsfr/dist/artwork/pictograms/system/technical-error.svg";
import { StaticImageData } from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { match } from "ts-pattern";

import { db } from "@/lib/kysely";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { capitalizeWords } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";

const getAllServiceUserAccounts = (id) =>
    db
        .selectFrom("service_accounts")
        .selectAll()
        .where("user_id", "=", id)
        .execute();

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const service_accounts = await getAllServiceUserAccounts(session.user.id);
    const sentry = service_accounts.find(
        (s) => s.account_type === SERVICES.SENTRY
    );
    const matomo = service_accounts.find(
        (s) => s.account_type === SERVICES.MATOMO
    );
    const mattermost = service_accounts.find(
        (s) => s.account_type === SERVICES.MATTERMOST
    );

    const services = [
        {
            account: matomo,
            artwork: dataviz,
            serviceName: SERVICES.MATOMO,
        },
        {
            account: sentry,
            serviceName: SERVICES.SENTRY,
            artwork: error,
        },
        // {
        //     service: mattermost,
        //     artwork: information,
        // },
    ];
    return (
        <div className={fr.cx("fr-container", "fr-pb-6w")}>
            <h2 className={fr.cx("fr-pt-4w")}>Demandes d'accès outils</h2>
            {services.map((service) => (
                <div
                    key={service.serviceName}
                    className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}
                >
                    <div className={fr.cx("fr-col-6")}>
                        <Tile
                            small={true}
                            // className={fr.cx("fr-tile--sm")}
                            title={capitalizeWords(service.serviceName || "")}
                            desc={match(service.account)
                                .with(
                                    {
                                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
                                    },
                                    () => (
                                        <Badge severity="success" as="span">
                                            Compte existant
                                        </Badge>
                                    )
                                )
                                .with(
                                    {
                                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                                    },
                                    () => (
                                        <Badge severity="new" as="span">
                                            Compte en cours de creation
                                        </Badge>
                                    )
                                )
                                .with(
                                    {
                                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT,
                                    },
                                    () => (
                                        <Badge severity="new" as="span">
                                            Tu as reçu une invitation par email
                                            pour te connecter.
                                        </Badge>
                                    )
                                )
                                .otherwise(() => (
                                    <Badge noIcon as="span">
                                        Pas de compte
                                    </Badge>
                                ))}
                            orientation="horizontal"
                            noIcon={true}
                            titleAs="h6"
                            imageSvg={false}
                            imageUrl={`static/images/${service.serviceName}.png`}
                            linkProps={{
                                href: `/services/${service.serviceName}`,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
