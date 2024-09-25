"use client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { SideMenu, SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useInfoContext } from "@/app/BreadCrumbProvider";
import frontConfig from "@/frontConfig";
import { linkRegistry } from "@/utils/routes/registry";
import { routeTitles } from "@/utils/routes/routeTitles";
import {
    hasPathnameThisMatch,
    hasPathnameThisRegex,
    hasPathnameThisRoot,
} from "@/utils/url";

export function PrivateLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const pathname = usePathname();

    const { status, data: session } = useSession({
        required: true,
        onUnauthenticated() {
            router.push("/login");
        },
    });

    const { currentPage } = useInfoContext();
    if (status === "loading") {
        return (
            <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center fr-mb-14v fr-my-4w">
                Chargement...
            </div>
        );
    }

    const accountLink = linkRegistry.get("account", undefined);
    const accountBadgeLink = linkRegistry.get("accountBadge", undefined);
    const communityLink = linkRegistry.get("community", undefined);
    const communityCreateMemberLink = linkRegistry.get(
        "communityCreateMember",
        undefined
    );
    const dashboardLink = linkRegistry.get("dashboard", undefined);
    const startupListLink = linkRegistry.get("startupList", undefined);
    const startupDetailLink = linkRegistry.get("startupDetails", {
        startupId: "",
    });
    const startupCreateLink = linkRegistry.get("startupCreate", undefined);
    const incubatorListLink = linkRegistry.get("incubatorList", undefined);
    const incubatorCreateLink = linkRegistry.get("incubatorCreate", undefined);

    const organizationListLink = linkRegistry.get(
        "organizationList",
        undefined
    );
    const organizationCreateLink = linkRegistry.get(
        "organizationCreate",
        undefined
    );
    const teamListLink = linkRegistry.get("teamList", undefined);
    const teamCreateLink = linkRegistry.get("teamCreate", undefined);

    const adminMattermostLink = linkRegistry.get("adminMattermost", undefined);
    const newsletterLink = linkRegistry.get("newsletters", undefined);
    const accountEditBaseInfoLink = linkRegistry.get(
        "accountEditBaseInfo",
        undefined
    );
    const accountBadgeRenewalLink = linkRegistry.get(
        "accountBadgeRenewal",
        undefined
    );
    const mapLink = linkRegistry.get("map", undefined);
    const metabaseLink = linkRegistry.get("metabase", undefined);
    const formationLink = linkRegistry.get("formationList", undefined);
    const eventsLink = linkRegistry.get("eventsList", undefined);
    const formationDetailLink = linkRegistry.get("formationDetails", undefined);
    const verifyLink = linkRegistry.get("verifyMember", undefined);

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
                href: "#",
            },
            text: "Badge",
            isActive: hasPathnameThisRoot(pathname, accountBadgeLink),
            expandedByDefault: hasPathnameThisRoot(pathname, accountBadgeLink),
            items: [
                {
                    linkProps: {
                        href: accountBadgeLink,
                    },
                    text: routeTitles.accountBadge(),
                    isActive: hasPathnameThisMatch(pathname, accountBadgeLink),
                },
                {
                    linkProps: {
                        href: accountBadgeRenewalLink,
                    },
                    text: routeTitles.accountBadgeRenewal(),
                    isActive: hasPathnameThisMatch(
                        pathname,
                        accountBadgeRenewalLink
                    ),
                },
            ],
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
        {
            linkProps: {
                href: currentPage,
            },
            dynamic: true,
            text: currentPage,
            isActive: hasPathnameThisRegex(
                pathname,
                "^/startups/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
            ),
        },
        {
            linkProps: {
                href: currentPage,
            },
            dynamic: true,
            text: currentPage,
            isActive: hasPathnameThisRegex(
                pathname,
                "^/startups/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$"
            ),
        },
    ];

    const incubatorSubPage: ItemLink[] = [
        {
            linkProps: {
                href: incubatorListLink,
            },
            text: routeTitles.incubatorList(),
            isActive: hasPathnameThisMatch(pathname, incubatorListLink),
        },
        {
            linkProps: {
                href: incubatorCreateLink,
            },
            text: routeTitles.incubatorCreate(),
            isActive: hasPathnameThisMatch(pathname, incubatorCreateLink),
        },
        {
            linkProps: {
                href: currentPage,
            },
            dynamic: true,
            text: currentPage,
            isActive: hasPathnameThisRegex(
                pathname,
                "^/incubators/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
            ),
        },
        {
            linkProps: {
                href: currentPage,
            },
            dynamic: true,
            text: currentPage,
            isActive: hasPathnameThisRegex(
                pathname,
                "^/incubators/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$"
            ),
        },
    ];

    const organizationSubPage: ItemLink[] = [
        {
            linkProps: {
                href: organizationListLink,
            },
            text: routeTitles.organizationList(),
            isActive: hasPathnameThisMatch(pathname, organizationListLink),
        },
        {
            linkProps: {
                href: organizationCreateLink,
            },
            text: routeTitles.organizationCreate(),
            isActive: hasPathnameThisMatch(pathname, organizationCreateLink),
        },
        {
            linkProps: {
                href: currentPage,
            },
            dynamic: true,
            text: currentPage,
            isActive: hasPathnameThisRegex(
                pathname,
                "^/organizations/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
            ),
        },
        {
            linkProps: {
                href: currentPage,
            },
            dynamic: true,
            text: currentPage,
            isActive: hasPathnameThisRegex(
                pathname,
                "^/organizations/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$"
            ),
        },
    ];

    const teamSubPage: ItemLink[] = [
        {
            linkProps: {
                href: teamListLink,
            },
            text: routeTitles.teamList(),
            isActive: hasPathnameThisMatch(pathname, teamListLink),
        },
        {
            linkProps: {
                href: teamCreateLink,
            },
            text: routeTitles.teamCreate(),
            isActive: hasPathnameThisMatch(pathname, teamCreateLink),
        },
        {
            linkProps: {
                href: currentPage,
            },
            dynamic: true,
            text: currentPage,
            isActive: hasPathnameThisRegex(
                pathname,
                "^/teams/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
            ),
        },
        {
            linkProps: {
                href: currentPage,
            },
            dynamic: true,
            text: currentPage,
            isActive: hasPathnameThisRegex(
                pathname,
                "^/teams/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$"
            ),
        },
    ];

    const MenuItems: ItemLink[] = [
        // {
        //     linkProps: {
        //         href: dashboardLink,
        //     },
        //     text: "Accueil",
        //     isActive: hasPathnameThisMatch(pathname, dashboardLink),
        // },
        {
            isActive: hasPathnameThisMatch(pathname, accountLink),
            // breadcrumb: {
            //     href: accountLink,
            // },
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
            items: [
                ...startupSubPage,
                {
                    linkProps: {
                        href: pathname,
                    },
                    text: currentPage || pathname,
                    isActive: hasPathnameThisRegex(pathname, startupDetailLink),
                },
            ],
        },
        {
            linkProps: {
                href: startupListLink,
            },
            text: "Metabase",
            isActive: hasPathnameThisMatch(pathname, metabaseLink),
        },
        // {
        //     linkProps: {
        //         href: incubatorListLink,
        //     },
        //     text: "Incubateur",
        //     isActive: hasPathnameThisMatch(pathname, incubatorListLink),
        //     expandedByDefault: Boolean(
        //         incubatorSubPage.find((a) => a.isActive)
        //     ),
        //     items: incubatorSubPage,
        // },
        {
            linkProps: {
                href: teamListLink,
            },
            text: "Équipe",
            isActive: hasPathnameThisMatch(pathname, teamListLink),
            items: teamSubPage,
        },
        {
            linkProps: {
                href: newsletterLink,
            },
            text: routeTitles.newsletters(),
            isActive: hasPathnameThisMatch(pathname, newsletterLink),
        },
        {
            linkProps: {
                href: eventsLink,
            },
            text: routeTitles.eventsList(),
            isActive: hasPathnameThisMatch(pathname, eventsLink),
        },
        {
            linkProps: {
                href: formationLink,
            },
            text: routeTitles.formationList(),
            isActive: hasPathnameThisRoot(pathname, formationLink),
            items: [
                {
                    linkProps: {
                        href: pathname,
                    },
                    text: currentPage || pathname,
                    isActive: hasPathnameThisRegex(
                        pathname,
                        formationDetailLink
                    ),
                },
            ],
        },
        {
            linkProps: {
                href: organizationListLink,
            },
            text: "Organisations",
            isActive: hasPathnameThisMatch(pathname, organizationListLink),
            items: organizationSubPage,
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
        dynamic?: boolean;
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
        const getSubMenu = () => {
            const firstSubPage = pathname.split("/")[1];
            if (firstSubPage.includes("account")) {
                return accountSubPages;
            } else if (firstSubPage.includes("teams")) {
                return teamSubPage;
            } else if (firstSubPage.includes("incubators")) {
                return incubatorSubPage;
            } else if (firstSubPage.includes("organizations")) {
                return organizationSubPage;
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
                            href: communityCreateMemberLink,
                        },
                        text: routeTitles.communityCreateMember(),
                        isActive: hasPathnameThisMatch(
                            pathname,
                            communityCreateMemberLink
                        ),
                    },
                    {
                        linkProps: {
                            href: mapLink,
                        },
                        text: routeTitles.map(),
                        isActive: hasPathnameThisMatch(pathname, mapLink),
                    },
                    {
                        linkProps: {
                            href: metabaseLink,
                        },
                        text: routeTitles.metabase(),
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
        return getSubMenu().filter((menu) => !menu.dynamic);
    };

    const tree = findActiveItem(MenuItems);
    return (
        <>
            {!hasPathnameThisMatch(pathname, verifyLink) &&
                pathname !== "/dashboard" && (
                    <Breadcrumb
                        currentPageLabel={tree[tree.length - 1]?.text}
                        homeLinkProps={{
                            href: "/",
                        }}
                        segments={tree
                            .slice(0, tree.length - 1)
                            .filter(
                                (segment) =>
                                    segment.linkProps?.href ||
                                    segment.breadcrumb?.href
                            )
                            .map((segment) => ({
                                label: segment.text,
                                linkProps: {
                                    href: (segment.linkProps?.href ||
                                        segment.breadcrumb?.href) as string,
                                },
                            }))}
                    />
                )}
            <div className="fr-grid-row fr-grid-row-gutters fr-my-4w">
                {!!frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE && (
                    <Alert
                        className="fr-mb-8v"
                        severity={
                            frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE
                                .severity
                        }
                        closable={false}
                        description={
                            frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE
                                .description
                        }
                        title={
                            frontConfig.NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE.title
                        }
                    />
                )}
                {!!displayMenuForSubPage(pathname).length && (
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
                )}
                <div
                    className={`fr-col-12 ${
                        !!displayMenuForSubPage(pathname).length
                            ? "fr-col-md-9 fr-col-lg-9"
                            : "fr-col-md-12 fr-col-lg-12"
                    }`}
                >
                    {children}
                </div>
            </div>
        </>
    );
}
