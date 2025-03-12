import { PropsWithChildren } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { NextAppDirEmotionCacheProvider } from "tss-react/next/appDir";

import { BreadCrumbProvider } from "./BreadCrumbProvider";
import ClientSessionProvider from "./context/ClientContextProvider";
import { defaultColorScheme } from "./defaultColorScheme";
import { MuiDsfrThemeProvider } from "./MuiDsfrThemeProvider";
import { StartDsfr } from "./StartDsfr";
import { Matomo } from "@/app/Matomo";
import Header from "@/components/Header";
import { Skiplinks } from "@/components/Skiplinks";
import { LiveChatProvider } from "@/components/live-chat/LiveChatProvider";
import { authOptions } from "@/utils/authoptions";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export interface RootLayoutProps {
    workaroundForNextJsPages?: boolean;
}

// [WORKAROUND] Since `react-dsfr` no longer passes the color scheme through `DsfrProvider` and `DsfrHead` we call this function to avoid an assert error in case of `workaroundForNextJsPages: true` usage
getHtmlAttributes({ defaultColorScheme });

async function MainStructure(props: PropsWithChildren) {
    const session = await getServerSession(authOptions);

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-head-element */}
            <head>
                <StartDsfr />
                <DsfrHead Link={Link} />
            </head>
            <body>
                <NextAppDirEmotionCacheProvider options={{ key: "css" }}>
                    <ClientSessionProvider>
                        <DsfrProvider>
                            <MuiDsfrThemeProvider>
                                <BreadCrumbProvider>
                                    <LiveChatProvider>
                                        <Skiplinks />
                                        <Header />
                                        <NuqsAdapter>
                                            <div
                                                className={`fr-container fr-container--fluid ${fr.cx(
                                                    "fr-mb-10v"
                                                )}`}
                                                id="root-container"
                                            >
                                                {props.children}
                                            </div>
                                            <Footer
                                                accessibility="non compliant"
                                                accessibilityLinkProps={{
                                                    href: "/accessibilite",
                                                }}
                                                contentDescription="Espace Membre est une application permettant aux membres de beta.gouv.fr d'accéder aux services et outils de la communauté."
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
                                        </NuqsAdapter>
                                    </LiveChatProvider>
                                </BreadCrumbProvider>
                            </MuiDsfrThemeProvider>
                        </DsfrProvider>
                        <Matomo />
                    </ClientSessionProvider>
                </NextAppDirEmotionCacheProvider>
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
        <html {...getHtmlAttributes({ defaultColorScheme, lang: "fr" })}>
            <MainStructure {...props} />
        </html>
    );
}

//@ts-ignore
export default RootLayout;
