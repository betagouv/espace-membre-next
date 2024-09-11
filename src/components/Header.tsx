"use client";
import React from "react";

import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { useLiveChat } from "@/components/live-chat/useLiveChat";
import { linkRegistry } from "@/utils/routes/registry";
import { routeTitles } from "@/utils/routes/routeTitles";
import { hasPathnameThisMatch, hasPathnameThisRoot } from "@/utils/url";

const MainHeader = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { showLiveChat, isLiveChatLoading } = useLiveChat();
    const pathname = usePathname();
    const newsletterLink = linkRegistry.get("newsletters", undefined);

    const dashboardLink = linkRegistry.get("dashboard", undefined);
    const accountLink = linkRegistry.get("account", undefined);
    const communityLink = linkRegistry.get("community", undefined);
    const startupListLink = linkRegistry.get("startupList", undefined);
    const incubatorListLink = linkRegistry.get("incubatorList", undefined);
    const adminMattermostLink = linkRegistry.get("adminMattermost", undefined);
    const formationListLink = linkRegistry.get("formationList", undefined);
    const eventsListLink = linkRegistry.get("eventsList", undefined);
    const quickAccessItems: HeaderProps.QuickAccessItem[] = [];
    if (session) {
        quickAccessItems.push({
            iconId: "fr-icon-account-line",
            text: session?.user?.name,
            linkProps: {
                href: linkRegistry.get("account", undefined),
            },
        });
        quickAccessItems.push({
            buttonProps: {
                onClick: async () => {
                    await signOut({
                        callbackUrl: "/",
                    });
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
            "/newsletters",
            "/formations",
            "/events",
            "/organizations",
            "/metabase",
            "/teams",
        ].find((url) => pathname.startsWith(url))
            ? [
                  {
                      linkProps: {
                          href: "/dashboard",
                          target: "_self",
                      },
                      text: routeTitles.dashboard(),
                      isActive: hasPathnameThisRoot(pathname, dashboardLink),
                  },
                  {
                      linkProps: {
                          href: "/account",
                          target: "_self",
                      },
                      text: routeTitles.account(),
                      isActive: hasPathnameThisRoot(pathname, "/account"),
                  },
                  {
                      isActive: hasPathnameThisRoot(pathname, communityLink),
                      linkProps: {
                          href: "/community",
                          target: "_self",
                      },
                      text: "Communauté",
                  },
                  {
                      linkProps: {
                          href: "/startups",
                          target: "_self",
                      },
                      text: "Produits",
                      isActive: hasPathnameThisRoot(pathname, startupListLink),
                  },
                  {
                      linkProps: {
                          href: "/incubators",
                          target: "_self",
                      },
                      text: "Incubateurs",
                      isActive: hasPathnameThisRoot(
                          pathname,
                          incubatorListLink
                      ),
                  },
                  {
                      linkProps: {
                          href: "/formations",
                          target: "_self",
                      },
                      text: "Formations",
                      isActive: hasPathnameThisRoot(
                          pathname,
                          formationListLink
                      ),
                  },
                  {
                      linkProps: {
                          href: "/events",
                          target: "_self",
                      },
                      text: "Événements",
                      isActive: hasPathnameThisRoot(pathname, eventsListLink),
                  },
                  {
                      linkProps: {
                          href: "/newsletters",
                      },
                      text: routeTitles.newsletters(),
                      isActive: hasPathnameThisMatch(pathname, newsletterLink),
                  },
              ]
            : [];
    if (session?.user?.isAdmin) {
        nav.push({
            linkProps: {
                href: "/admin/mattermost",
                target: "_self",
            },
            text: "Admin",
            isActive: hasPathnameThisRoot(pathname, adminMattermostLink),
        });
    }
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
