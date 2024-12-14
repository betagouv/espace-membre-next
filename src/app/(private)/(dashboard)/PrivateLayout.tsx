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

    const { currentPage, currentItemId } = useInfoContext();
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
    const metabaseLink = linkRegistry.get("metabase", undefined);
    const serviceLink = "/services";
    const formationLink = linkRegistry.get("formationList", undefined);
    const eventsLink = linkRegistry.get("eventsList", undefined);
    const formationDetailLink = linkRegistry.get("formationDetails", undefined);
    const verifyLink = linkRegistry.get("verifyMember", undefined);

    const MenuItems: ItemLink[] = [
        {
            href: communityLink,
            text: "Membres",
            isActive: hasPathnameThisMatch(pathname, communityLink),
            items: [
                {
                    href: communityCreateMemberLink,
                    text: routeTitles.communityCreateMember(),
                    isActive: hasPathnameThisMatch(
                        pathname,
                        communityCreateMemberLink
                    ),
                },
                {
                    href: () =>
                        linkRegistry.get("communityMember", {
                            username: currentItemId || "",
                        }),
                    text: currentPage,
                    isActive: hasPathnameThisRegex(
                        pathname,
                        "^/community/[a-zA-Z]+.[a-zA-Z]+"
                    ),
                    items: [
                        {
                            href: pathname,
                            text: "Mise à jour de la fiche",
                            isActive: hasPathnameThisRegex(
                                pathname,
                                "^/community/[a-zA-Z]+.[a-zA-Z]+/update"
                            ),
                        },
                    ],
                },
            ],
        },
        {
            href: startupListLink,
            text: "Produits",
            isActive: hasPathnameThisMatch(pathname, startupListLink),
            items: [
                {
                    href: startupCreateLink,
                    text: routeTitles.startupCreate(),
                    isActive: hasPathnameThisMatch(pathname, startupCreateLink),
                },
                {
                    href: () =>
                        linkRegistry.get("startupDetails", {
                            startupId: currentItemId,
                        }),
                    text: currentPage,
                    isActive: hasPathnameThisRegex(
                        pathname,
                        "^/startups/[^/]+"
                    ),
                    items: [
                        {
                            href: linkRegistry.get("startupDetailsEdit", {
                                startupId: "none",
                            }),
                            text: "Modifier la fiche",
                            isActive: false,
                        },
                        {
                            href: linkRegistry.get("startupDocs", {
                                startupId: "none",
                            }),
                            text: "Documents",
                            isActive: false,
                        },
                    ],
                },
            ],
        },
        {
            href: communityLink,
            text: "Communauté",
            isActive: hasPathnameThisMatch(pathname, communityLink),
            items: [
                {
                    href: incubatorListLink,
                    text: "Incubateurs",
                    isActive: hasPathnameThisMatch(pathname, incubatorListLink),
                    items: [
                        {
                            href: incubatorCreateLink,
                            text: routeTitles.incubatorCreate(),
                            isActive: hasPathnameThisMatch(
                                pathname,
                                incubatorCreateLink
                            ),
                        },
                        {
                            href: () =>
                                linkRegistry.get("incubatorDetails", {
                                    incubatorId: currentItemId,
                                }),
                            text: currentPage,
                            isActive: hasPathnameThisRegex(
                                pathname,
                                "^/incubators/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
                            ),
                            items: [
                                {
                                    href: pathname,
                                    text: "Modifier la fiche",
                                    isActive: hasPathnameThisRegex(
                                        pathname,
                                        "^/incubators/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$"
                                    ),
                                },
                            ],
                        },
                    ],
                },
                {
                    href: organizationListLink,
                    text: "Sponsors",
                    isActive: hasPathnameThisMatch(
                        pathname,
                        organizationListLink
                    ),
                    items: [
                        {
                            href: organizationCreateLink,
                            text: routeTitles.organizationCreate(),
                            isActive: hasPathnameThisMatch(
                                pathname,
                                organizationCreateLink
                            ),
                        },
                        {
                            href: () => {
                                return linkRegistry.get("organizationDetails", {
                                    organizationId:
                                        currentItemId || currentPage,
                                });
                            },
                            text: currentPage,
                            isActive: hasPathnameThisRegex(
                                pathname,
                                "^/organizations/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
                            ),
                            items: [
                                {
                                    href: pathname,
                                    text: "Modifier la fiche",
                                    isActive: hasPathnameThisRegex(
                                        pathname,
                                        "^/organizations/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$"
                                    ),
                                },
                            ],
                        },
                    ],
                },
                {
                    href: teamListLink,
                    text: "Équipes",
                    isActive: hasPathnameThisMatch(pathname, teamListLink),
                    items: [
                        {
                            href: teamCreateLink,
                            text: routeTitles.teamCreate(),
                            isActive: hasPathnameThisMatch(
                                pathname,
                                teamCreateLink
                            ),
                        },
                        {
                            href: () =>
                                linkRegistry.get("teamDetails", {
                                    teamId: currentItemId || currentPage,
                                }),
                            text: currentPage,
                            isActive: hasPathnameThisRegex(
                                pathname,
                                "^/teams/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
                            ),
                            items: [
                                {
                                    href: pathname,
                                    text: "Modifier la fiche",
                                    isActive: hasPathnameThisRegex(
                                        pathname,
                                        "^/teams/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$"
                                    ),
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            href: accountLink,
            text: routeTitles.account(),
            isActive: hasPathnameThisMatch(pathname, accountLink),
            items: [
                {
                    href: accountEditBaseInfoLink,
                    text: "Modifier ma fiche",
                    isActive: hasPathnameThisMatch(
                        pathname,
                        accountEditBaseInfoLink
                    ),
                },
                {
                    href: "/services",
                    text: "Outils",
                    isActive: hasPathnameThisMatch(pathname, "/services"),
                    items: [
                        {
                            href: "/services/sentry",
                            text: "Sentry",
                            isActive: hasPathnameThisMatch(
                                pathname,
                                "/services/sentry"
                            ),
                        },
                        {
                            href: "/services/matomo",
                            text: "Matomo",
                            isActive: hasPathnameThisMatch(
                                pathname,
                                "/services/matomo"
                            ),
                        },
                        {
                            href: "/services/mattermost",
                            text: "Mattermost",
                            isActive: hasPathnameThisMatch(
                                pathname,
                                "/services/mattermost"
                            ),
                        },
                    ],
                },
            ],
        },
        {
            href: newsletterLink,
            text: routeTitles.newsletters(),
            isActive: hasPathnameThisMatch(pathname, newsletterLink),
        },
        {
            href: eventsLink,
            text: routeTitles.eventsList(),
            isActive: hasPathnameThisMatch(pathname, eventsLink),
        },
        {
            href: formationLink,
            text: routeTitles.formationList(),
            isActive: hasPathnameThisRoot(pathname, formationLink),
            items: [
                {
                    href: pathname,
                    text: currentPage || pathname,
                    isActive: hasPathnameThisRegex(
                        pathname,
                        formationDetailLink
                    ),
                },
            ],
        },
        {
            href: serviceLink,
            text: routeTitles.serviceList(),
            isActive: hasPathnameThisMatch(pathname, serviceLink),
        },
        {
            href: adminMattermostLink,
            text: "Admin",
            isActive: hasPathnameThisMatch(pathname, adminMattermostLink),
        },
    ];

    interface ItemLink {
        href: string | (() => string);
        text: string;
        isActive: boolean;
        items?: ItemLink[];
    }

    const findActiveItem = (items: ItemLink[]) => {
        let tree: ItemLink[] = [];
        for (const i of items) {
            let childrenTree: ItemLink[] = [];
            if (i.items && i.items.length) {
                childrenTree = findActiveItem(i.items);
            }
            if (childrenTree.length) {
                tree = [i, ...childrenTree];
            } else if (i.isActive) {
                tree = [i];
                break;
            }
        }
        return tree;
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
                            .filter((segment) => segment.href)
                            .map((segment) => ({
                                label: segment.text,
                                linkProps: {
                                    href:
                                        typeof segment.href === "function"
                                            ? segment.href()
                                            : segment.href,
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
                <div className={`fr-col-12 fr-col-md-12 fr-col-lg-12`}>
                    {children}
                </div>
            </div>
        </>
    );
}
