import { fr } from "@codegouvfr/react-dsfr";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import school from "@gouvfr/dsfr/dist/artwork/pictograms/buildings/school.svg";
import mailSend from "@gouvfr/dsfr/dist/artwork/pictograms/digital/mail-send.svg";
import document from "@gouvfr/dsfr/dist/artwork/pictograms/document/document.svg";
import community from "@gouvfr/dsfr/dist/artwork/pictograms/environment/human-cooperation.svg";
import locationFrance from "@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg";
import { StaticImageData } from "next/image";

import { SurveyBox } from "@/components/SurveyBox";
import { linkRegistry } from "@/utils/routes/registry";

export interface DashboardPageProps {
    surveyCookieValue: string | null;
}

export default async function Page(props: DashboardPageProps) {
    return (
        <div className={fr.cx("fr-container", "fr-pb-6w")}>
            <h2 className={fr.cx("fr-pt-4w")}>Admin</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Mattermost"
                        desc="Voir les membres mattermost"
                        orientation="horizontal"
                        imageUrl={(community as StaticImageData).src}
                        linkProps={{
                            href: "/admin/mattermost",
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Newsletters"
                        desc="Definir la date de la prochaine newsletters"
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
