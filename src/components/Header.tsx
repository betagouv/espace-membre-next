"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header, HeaderProps } from "@codegouvfr/react-dsfr/Header";
// import { useSession, signIn, signOut } from "next-auth/react";
import { linkRegistry } from "@/utils/routes/registry";
import { useSession, signOut } from "@/proxies/next-auth";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";
import { hasPathnameThisMatch, hasPathnameThisRoot } from "@/utils/url";
import { routeTitles } from "@/utils/routes/routeTitles";

const MainHeader = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const newsletterLink = linkRegistry.get("newsletters", undefined);

    const accountLink = linkRegistry.get("account", undefined);
    const accountBadgeLink = linkRegistry.get("accountBadge", undefined);
    const communityLink = linkRegistry.get("community", undefined);
    const startupListLink = linkRegistry.get("startupList", undefined);
    const startupCreateLink = linkRegistry.get("startupCreate", undefined);
    const adminMattermostLink = linkRegistry.get("adminMattermost", undefined);
    const accountEditBaseInfoLink = linkRegistry.get(
        "accountEditBaseInfo",
        undefined
    );
    const accountEditPrivateInfoLink = linkRegistry.get(
        "accountEditPrivateInfo",
        undefined
    );
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
                    await axios.get(computeRoute(routes.LOGOUT_API), {
                        withCredentials: true,
                    });
                    window.location.href = "/";
                    //signOut();
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

    const nav =
        session?.user &&
        ["/account", "/community", "/admin", "/startups", "/newsletters"].find(
            (url) => pathname.startsWith(url)
        )
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
            serviceTitle="Espace Membre @beta.gouv.fr"
        />
    );
};

export default MainHeader;
