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

    const accountLink = linkRegistry.get("account", undefined);
    const communityLink = linkRegistry.get("community", undefined);
    const startupListLink = linkRegistry.get("startupList", undefined);
    const adminMattermostLink = linkRegistry.get("adminMattermost", undefined);
    const formationListLink = linkRegistry.get("formationList", undefined);
    const quickAccessItems: (React.ReactNode | HeaderProps.QuickAccessItem)[] =
        [];
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
            "/account",
            "/community",
            "/admin",
            "/startups",
            "/newsletters",
            "/formations",
        ].find((url) => pathname.startsWith(url))
            ? [
                  {
                      linkProps: {
                          href: "/account",
                          target: "_self",
                      },
                      text: routeTitles.account(),
                      isActive: hasPathnameThisRoot(pathname, accountLink),
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
                      text: "Produit",
                      isActive: hasPathnameThisRoot(pathname, startupListLink),
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
            quickAccessItems={[...quickAccessItems]}
            serviceTitle="Espace Membre"
            serviceTagline="Communauté beta.gouv.fr"
        />
    );
};

export default MainHeader;
