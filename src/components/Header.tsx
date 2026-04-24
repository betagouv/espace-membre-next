"use client";
import React from "react";

import { routes } from "@/utils/routes/routes";

import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";

import { useLiveChat } from "@/components/live-chat/useLiveChat";
import { routeTitles } from "@/utils/routes/routeTitles";

const isCurrentPath = (pathname, rootPath) => pathname.startsWith(rootPath);

const MainHeader = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showLiveChat, isLiveChatLoading } = useLiveChat();
  const pathname = usePathname();

  const dashboardLink = routes["dashboard"]();
  const accountLink = routes["account"]();
  const communityLink = routes["community"]();
  const startupListLink = routes["startupList"]();
  const incubatorListLink = routes["incubatorList"]();
  const formationListLink = routes["formationList"]();
  const eventsListLink = routes["eventsList"]();
  const metabaseLink = routes["metabase"]();
  const quickAccessItems: HeaderProps.QuickAccessItem[] = [];
  if (session) {
    quickAccessItems.push({
      iconId: "fr-icon-account-line",
      text: session?.user?.name,
      linkProps: {
        href: routes["account"](),
      },
    });
    quickAccessItems.push({
      buttonProps: {
        onClick: async () => {
          if (session.user.provider === "proconnect") {
            // https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/implementation_technique#241-d%C3%A9connexion-aupr%C3%A8s-de-proconnect
            const idTokenHint = session.user.id_token;
            const signOutUrl = `${
              process.env.NEXT_PUBLIC_PRO_CONNECT_BASE_URL
            }/api/v2/session/end?id_token_hint=${idTokenHint}&state=${uuidv4()}&post_logout_redirect_uri=${encodeURIComponent(
              process.env.NEXT_PUBLIC_APP_BASE_URL || "",
            )}/login`;
            await signOut({
              callbackUrl: "/login",
            });
            router.push(signOutUrl);
          } else {
            await signOut({
              callbackUrl: "/",
            });
          }
        },
      },
      iconId: "fr-icon-logout-box-r-line",
      text: `Se déconnecter`,
    });
  } else {
    if (pathname !== "/login") {
      quickAccessItems.push({
        buttonProps: {
          onClick: () => {
            router.push("/login");
          },
        },
        iconId: "fr-icon-account-line",
        text: "Se connecter",
      });
    }
  }
  quickAccessItems.push({
    iconId: "fr-icon-questionnaire-line",
    buttonProps: {
      onClick: () => {
        showLiveChat();
      },
    },
    text: isLiveChatLoading ? "Chargement..." : "Support",
  });

  const nav =
    session?.user &&
    [
      "/dashboard",
      "/account",
      "/community",
      "/admin",
      "/incubator",
      "/startups",
      "/formations",
      "/events",
      "/organizations",
      "/metabase",
      "/teams",
      "/services",
    ].find((url) => pathname.startsWith(url))
      ? [
          {
            linkProps: {
              href: "/dashboard",
              target: "_self",
            },
            text: routeTitles.dashboard(),
            isActive: isCurrentPath(pathname, dashboardLink),
          },
          {
            linkProps: {
              href: "/account",
              target: "_self",
            },
            text: routeTitles.account(),
            isActive: isCurrentPath(pathname, accountLink),
          },
          {
            isActive:
              isCurrentPath(pathname, incubatorListLink) ||
              isCurrentPath(pathname, routes["organizationList"]()) ||
              isCurrentPath(pathname, routes["teamList"]()),
            text: "Communauté",
            menuLinks: [
              {
                linkProps: {
                  href: routes["community"](),
                },
                text: "Membres",
                isActive: isCurrentPath(pathname, communityLink),
              },
              {
                linkProps: {
                  href: routes["organizationList"](),
                },
                isActive: isCurrentPath(pathname, routes["organizationList"]()),
                text: "Sponsors",
              },
              {
                linkProps: {
                  href: routes["teamList"](),
                },
                text: "Équipes incubateur",
                isActive: isCurrentPath(pathname, routes["teamList"]()),
              },
              {
                linkProps: {
                  href: incubatorListLink,
                },
                isActive: isCurrentPath(pathname, incubatorListLink),
                text: "Incubateurs",
              },
              {
                linkProps: {
                  href: metabaseLink,
                },
                isActive: isCurrentPath(pathname, metabaseLink),
                text: "Observatoire",
              },
            ],
          },
          {
            linkProps: {
              href: startupListLink,
            },
            isActive: isCurrentPath(pathname, startupListLink),
            text: "Produits",
          },
          {
            linkProps: {
              href: "/formations",
              target: "_self",
            },
            text: "Formations",
            isActive: isCurrentPath(pathname, formationListLink),
          },
          {
            linkProps: {
              href: "/events",
              target: "_self",
            },
            text: "Événements",
            isActive: isCurrentPath(pathname, eventsListLink),
          },
          {
            linkProps: {
              href: "https://docs.numerique.gouv.fr/docs/8354b3be-0f1f-4690-8f89-a6c4a738f374/",
              target: "_blank",
            },
            text: "Infolettre",
            isActive: false,
          },
        ]
      : [];

  return (
    <Header
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
      navigation={nav}
      id="fr-header-header-with-quick-access-items"
      quickAccessItems={quickAccessItems}
      serviceTitle="Espace Membre"
      serviceTagline="Communauté beta.gouv.fr"
    />
  );
};

export default MainHeader;
