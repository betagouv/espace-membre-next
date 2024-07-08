"use client";

import { routeTitles } from "@/utils/routes/routeTitles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

export interface MapPageProps {}

export function MapPage(props: MapPageProps) {
    //
    // Note: since we wanted to integrate it easily we kept the logic inside an iframe
    // Because it requires some work to redo it properly inside React with Leaflet library for example
    //

    const muiTheme = useTheme();
    const breakpointLg = useMediaQuery(muiTheme.breakpoints.up("lg"));
    const breakpointMd = useMediaQuery(muiTheme.breakpoints.up("md"));

    const modal = createModal({
        id: "map-modal",
        isOpenedByDefault: false,
    });

    return breakpointLg ? (
        <iframe
            title={routeTitles.map()}
            src="/map-embedded"
            style={{
                width: "100%",
                height: "100%",
            }}
        />
    ) : (
        <div className={fr.cx("fr-container", "fr-py-6w")}>
            <div
                className={fr.cx(
                    "fr-grid-row",
                    "fr-grid-row--middle",
                    "fr-grid-row--center"
                )}
                style={{ height: "100%" }}
            >
                <Button nativeButtonProps={modal.buttonProps}>
                    Afficher la carte des membres de la communauté
                </Button>
                <modal.Component title="Membres de la communauté">
                    <iframe
                        title={routeTitles.map()}
                        src="/map-embedded"
                        style={{
                            width: "100%",
                            height: breakpointMd ? "50vh" : "75vh", // Doing it properly with the `react-dsfr` modal is too hacky so harcoding a working value
                        }}
                    />
                </modal.Component>
            </div>
        </div>
    );
}
