import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import { PropsWithChildren } from "react";
import { StartDsfr } from "./StartDsfr";
import { MuiDsfrThemeProvider } from "./MuiDsfrThemeProvider";
import NextAuthSessionProvider from "@/providers/SessionProvider";
import Header from "@/components/Header";
import { defaultColorScheme } from "./defaultColorScheme";

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
                        <NextAuthSessionProvider>
                            <Header></Header>
                            <div className="fr-container fr-container--fluid fr-mb-14v fr-mt-14v">
                                <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                                    {props.children}
                                </div>
                            </div>
                        </NextAuthSessionProvider>
                    </MuiDsfrThemeProvider>
                </DsfrProvider>
            </body>
        </>
    );
}

export function RootLayout(props: PropsWithChildren<RootLayoutProps>) {
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
