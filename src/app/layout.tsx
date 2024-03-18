import { PropsWithChildren } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";

import { BreadCrumbProvider } from "./BreadCrumbProvider";
import { defaultColorScheme } from "./defaultColorScheme";
import { MuiDsfrThemeProvider } from "./MuiDsfrThemeProvider";
import { StartDsfr } from "./StartDsfr";
import Header from "@/components/Header";

export interface RootLayoutProps {
    workaroundForNextJsPages?: boolean;
}

// [WORKAROUND] Since `react-dsfr` no longer passes the color scheme through `DsfrProvider` and `DsfrHead` we call this function to avoid an assert error in case of `workaroundForNextJsPages: true` usage
getHtmlAttributes({ defaultColorScheme });

function MainStructure(props: PropsWithChildren) {
    return (
        <>
            {/* eslint-disable-next-line @next/next/no-head-element */}
            <head>
                <StartDsfr />
                <DsfrHead />
            </head>
            <body>
                <DsfrProvider>
                    <MuiDsfrThemeProvider>
                        <BreadCrumbProvider>
                            <Header />
                            <div
                                className={`fr-container fr-container--fluid ${fr.cx(
                                    "fr-mb-10v"
                                )}`}
                                id="root-container"
                            >
                                {props.children}
                            </div>
                            <Footer
                                accessibility="partially compliant"
                                contentDescription="Espace Membre est une application permettant aux membres de la communauté beta.gouv.fr d'accéder aux espaces dédiés à la communauté."
                                termsLinkProps={{
                                    href: "#",
                                }}
                                brandTop={
                                    <>
                                        République
                                        <br />
                                        Française
                                    </>
                                }
                                homeLinkProps={{
                                    href: "/",
                                    title: "Accueil - Espace Membre @beta.gouv.fr",
                                }}
                                websiteMapLinkProps={{
                                    href: "#",
                                }}
                            />
                        </BreadCrumbProvider>
                    </MuiDsfrThemeProvider>
                </DsfrProvider>
            </body>
        </>
    );
}

function RootLayout(props: PropsWithChildren<RootLayoutProps>) {
    if (props.workaroundForNextJsPages === true) {
        // When embedded through a server-side only page (for errors for example) `<html>` and `<body>`
        // are already included by Next.js (the browser can ajust the structure but in our case `<html>` duplication
        // throws a visible error in development so we avoid it (it does not change things that much since it's only specific pages))
        return <MainStructure {...props} />;
    }

    return (
        <html lang="fr" {...getHtmlAttributes({ defaultColorScheme })}>
            <MainStructure {...props} />
        </html>
    );
}

export default RootLayout;
