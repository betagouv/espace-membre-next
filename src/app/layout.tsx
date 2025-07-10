import { PropsWithChildren } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { getServerSession } from "next-auth/next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { NextAppDirEmotionCacheProvider } from "tss-react/next/appDir";

import { BreadCrumbProvider } from "./BreadCrumbProvider";
import ClientSessionProvider from "./context/ClientContextProvider";
import { MuiDsfrThemeProvider } from "./MuiDsfrThemeProvider";
import { Matomo } from "@/app/Matomo";
import Header from "@/components/Header";
import { LiveChatProvider } from "@/components/live-chat/LiveChatProvider";
import { Skiplinks } from "@/components/Skiplinks";
import { authOptions } from "@/utils/authoptions";

import {
  getHtmlAttributes,
  DsfrHead,
} from "../dsfr-bootstrap/server-only-index";
import { DsfrProvider, StartDsfrOnHydration } from "../dsfr-bootstrap";
export interface RootLayoutProps {
  workaroundForNextJsPages?: boolean;
}

async function MainStructure(props: PropsWithChildren) {
  const session = await getServerSession(authOptions);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <DsfrHead />
      </head>
      <body>
        <StartDsfrOnHydration />
        <NextAppDirEmotionCacheProvider options={{ key: "css" }}>
          <ClientSessionProvider>
            <DsfrProvider lang="fr">
              <MuiDsfrThemeProvider>
                <BreadCrumbProvider>
                  <LiveChatProvider>
                    <Skiplinks />
                    <Header />
                    <NuqsAdapter>
                      <div
                        className={`fr-container fr-container--fluid ${fr.cx(
                          "fr-mb-10v",
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
    <html {...getHtmlAttributes({ lang: "fr" })}>
      <MainStructure {...props} />
    </html>
  );
}

//@ts-ignore
export default RootLayout;
