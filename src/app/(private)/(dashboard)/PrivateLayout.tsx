import { linkRegistry } from "@/utils/routes/registry";
import { hasPathnameThisMatch } from "@/utils/url";
import { SideMenu, SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { useSession } from "@/proxies/next-auth";
import { usePathname, useRouter } from "next/navigation";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { routeTitles } from "@/utils/routes/routeTitles";

export function PrivateLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const pathname = usePathname();

    const { status, data: session } = useSession({
        required: true,
        onUnauthenticated() {
            router.push("/login");
        },
    });

    if (status === "loading") {
        <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center fr-mb-14v">
            "Chargement...";
        </div>;
    }

    const accountLink = linkRegistry.get("account", undefined);
    const accountBadgeLink = linkRegistry.get("accountBadge", undefined);
    const communityLink = linkRegistry.get("community", undefined);
    const startupListLink = linkRegistry.get("startupList", undefined);
    const startupCreateLink = linkRegistry.get("startupCreate", undefined);
    const adminMattermostLink = linkRegistry.get("adminMattermost", undefined);
    const newsletterLink = linkRegistry.get("newsletters", undefined);
    const accountEditBaseInfoLink = linkRegistry.get(
        "accountEditBaseInfo",
        undefined
    );
    const accountEditPrivateInfoLink = linkRegistry.get(
        "accountEditPrivateInfo",
        undefined
    );
    const accountBadge = linkRegistry.get("accountBadge", undefined);
    const mapLink = linkRegistry.get("map", undefined);

    const accountSubPages: ItemLink[] = [
        {
            linkProps: {
                href: accountLink,
            },
            text: routeTitles.account(),
            isActive: hasPathnameThisMatch(pathname, accountLink),
        },
        {
            linkProps: {
                href: accountEditBaseInfoLink,
            },
            text: routeTitles.accountEditBaseInfo(),
            isActive: hasPathnameThisMatch(pathname, accountEditBaseInfoLink),
        },
        {
            linkProps: {
                href: accountEditPrivateInfoLink,
            },
            text: routeTitles.accountEditPrivateInfo(),
            isActive: hasPathnameThisMatch(
                pathname,
                accountEditPrivateInfoLink
            ),
        },
        {
            linkProps: {
                href: accountBadgeLink,
            },
            text: routeTitles.accountBadge(),
            isActive: hasPathnameThisMatch(pathname, accountBadgeLink),
        },
    ];

    const startupSubPage: ItemLink[] = [
        {
            linkProps: {
                href: startupListLink,
            },
            text: routeTitles.startupList(),
            isActive: hasPathnameThisMatch(pathname, startupListLink),
        },
        {
            linkProps: {
                href: startupCreateLink,
            },
            text: routeTitles.startupCreate(),
            isActive: hasPathnameThisMatch(pathname, startupCreateLink),
        },
    ];

    const MenuItems: ItemLink[] = [
        {
            isActive: hasPathnameThisMatch(pathname, accountLink),
            breadcrumb: {
                href: accountLink,
            },
            text: "Compte",
            expandedByDefault:
                Boolean(accountSubPages.find((a) => a.isActive)) ||
                Boolean(accountSubPages.find((a) => a.expandedByDefault)),
            items: accountSubPages,
        },
        {
            linkProps: {
                href: communityLink,
            },
            text: "Communauté",
            isActive: hasPathnameThisMatch(pathname, communityLink),
        },
        {
            linkProps: {
                href: startupListLink,
            },
            text: "Produit",
            isActive: hasPathnameThisMatch(pathname, startupListLink),
            expandedByDefault: Boolean(startupSubPage.find((a) => a.isActive)),
            items: startupSubPage,
        },
        {
            linkProps: {
                href: newsletterLink,
            },
            text: routeTitles.newsletters(),
            isActive: hasPathnameThisMatch(pathname, newsletterLink),
            items: startupSubPage,
        },
    ];

    if (session?.user?.isAdmin) {
        MenuItems.push({
            linkProps: {
                href: adminMattermostLink,
            },
            text: "Admin",
            isActive: hasPathnameThisMatch(pathname, adminMattermostLink),
        });
    }

    interface ItemLink {
        linkProps?: { href: string };
        text: string;
        isActive: boolean;
        expandedByDefault?: boolean;
        breadcrumb?: {
            href: string;
        };
        items?: ItemLink[];
    }

    const findActiveItem = (items: ItemLink[]) => {
        let tree: ItemLink[] = [];
        items.forEach((i) => {
            let childrenTree: ItemLink[] = [];
            if (i.items && i.items.length) {
                childrenTree = findActiveItem(i.items);
            }
            if (childrenTree.length) {
                tree = [i, ...childrenTree];
            } else if (i.isActive) {
                tree = [i];
            }
        });
        return tree;
    };

    const displayMenuForSubPage = (pathname) => {
        const firstSubPage = pathname.split("/")[1];
        console.log(pathname, firstSubPage);
        if (firstSubPage.includes("account")) {
            return accountSubPages;
        } else if (firstSubPage.includes("startups")) {
            return startupSubPage;
        } else if (firstSubPage.includes("community")) {
            return [
                {
                    linkProps: {
                        href: communityLink,
                    },
                    text: routeTitles.community(),
                    isActive: hasPathnameThisMatch(pathname, communityLink),
                },
                {
                    linkProps: {
                        href: mapLink,
                    },
                    text: routeTitles.map(),
                    isActive: hasPathnameThisMatch(pathname, mapLink),
                },
            ];
        } else if (firstSubPage.includes("admin")) {
            return [
                {
                    linkProps: {
                        href: communityLink,
                    },
                    text: routeTitles.adminMattermost(),
                    isActive: hasPathnameThisMatch(
                        pathname,
                        adminMattermostLink
                    ),
                },
            ];
        }
        return [];
    };

    const tree = findActiveItem(MenuItems);
    return (
        <>
            {/* <div className="fr-grid-row"> */}
            <Breadcrumb
                currentPageLabel={tree[tree.length - 1]?.text}
                homeLinkProps={{
                    href: "/",
                }}
                segments={tree
                    .slice(0, tree.length - 1)
                    .filter(
                        (segment) =>
                            segment.linkProps?.href || segment.breadcrumb?.href
                    )
                    .map((segment) => ({
                        label: segment.text,
                        linkProps: {
                            href: (segment.linkProps?.href ||
                                segment.breadcrumb?.href) as string,
                        },
                    }))}
            />
            {/* </div> */}
            <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center">
                <div className="fr-col-12 fr-col-md-3 fr-col-lg-3">
                    <SideMenu
                        align="left"
                        burgerMenuButtonText="Dans cette rubrique"
                        items={
                            displayMenuForSubPage(
                                pathname
                            ) as SideMenuProps.Item[]
                        }
                        // title="Espace-Membre"
                    />
                </div>
                <div className="fr-col-12 fr-col-md-9 fr-col-lg-9">
                    {children}
                </div>
            </div>
        </>
    );
}
