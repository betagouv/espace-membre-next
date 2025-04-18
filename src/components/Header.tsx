"use client";
import React from "react";

import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";

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
                    if (session.user.provider === "proconnect") {
                        // https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/implementation_technique#241-d%C3%A9connexion-aupr%C3%A8s-de-proconnect
                        const idTokenHint = session.user.id_token;
                        const signOutUrl = `${
                            process.env.NEXT_PUBLIC_PRO_CONNECT_BASE_URL
                        }/api/v2/session/end?id_token_hint=${idTokenHint}&state=${uuidv4()}&post_logout_redirect_uri=${encodeURIComponent(
                            process.env.NEXT_PUBLIC_APP_BASE_URL || ""
                        )}/login`;
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
            "/newsletters",
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
                      isActive: hasPathnameThisRoot(pathname, dashboardLink),
                  },
                  {
                      linkProps: {
                          href: "/account",
                          target: "_self",
                      },
                      text: routeTitles.account(),
                      isActive: hasPathnameThisRoot(pathname, accountLink),
                  },
                  {
                      isActive:
                          hasPathnameThisRoot(pathname, incubatorListLink) ||
                          hasPathnameThisRoot(
                              pathname,
                              linkRegistry.get("organizationList", undefined)
                          ) ||
                          hasPathnameThisRoot(
                              pathname,
                              linkRegistry.get("teamList", undefined)
                          ),
                      text: "Communauté",
                      menuLinks: [
                          {
                              linkProps: {
                                  href: linkRegistry.get(
                                      "community",
                                      undefined
                                  ),
                              },
                              text: "Membres",
                              isActive: hasPathnameThisRoot(
                                  pathname,
                                  communityLink
                              ),
                          },
                          {
                              linkProps: {
                                  href: linkRegistry.get(
                                      "organizationList",
                                      undefined
                                  ),
                              },
                              isActive: hasPathnameThisRoot(
                                  pathname,
                                  linkRegistry.get(
                                      "organizationList",
                                      undefined
                                  )
                              ),
                              text: "Sponsors",
                          },
                          {
                              linkProps: {
                                  href: linkRegistry.get("teamList", undefined),
                              },
                              text: "Équipes incubateur",
                              isActive: hasPathnameThisRoot(
                                  pathname,
                                  linkRegistry.get("teamList", undefined)
                              ),
                          },
                          {
                              linkProps: {
                                  href: incubatorListLink,
                              },
                              isActive: hasPathnameThisRoot(
                                  pathname,
                                  incubatorListLink
                              ),
                              text: "Incubateurs",
                          },
                      ],
                  },
                  {
                      linkProps: {
                          href: startupListLink,
                      },
                      isActive: hasPathnameThisRoot(pathname, startupListLink),
                      text: "Produits",
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
                href: "/admin",
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
