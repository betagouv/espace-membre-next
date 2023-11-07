import { linkRegistry } from "@/utils/routes/registry";
import { hasPathnameThisMatch } from "@/utils/url";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { useSession } from "@/proxies/next-auth";
import { usePathname, useRouter } from "next/navigation";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";

export function PrivateLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    // const sessionWrapper = useSession();
    const pathname = usePathname();

    const { status, data: session } = useSession({
        required: true,
        onUnauthenticated() {
            router.push("/login");
        },
    });

    if (status === "loading") {
        return "Chargement...";
    }

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

    const userInfoSubPages = [
        {
            linkProps: {
                href: accountEditBaseInfoLink,
            },
            text: "Mise à jour de mes infos",
            isActive: hasPathnameThisMatch(pathname, accountEditBaseInfoLink),
        },
        {
            linkProps: {
                href: accountEditPrivateInfoLink,
            },
            text: "Mise à jour des mes infos privées",
            isActive: hasPathnameThisMatch(
                pathname,
                accountEditPrivateInfoLink
            ),
        },
    ];

    const accountSubPages = [
        {
            // linkProps: {
            //     href: accountLink,
            // },
            text: "Mes infos",
            isActive: hasPathnameThisMatch(pathname, accountLink),
            expandedByDefault: Boolean(
                userInfoSubPages.find((a) => a.isActive)
            ),
            items: userInfoSubPages,
        },
    ];

    const startupSubPage = [
        {
            linkProps: {
                href: startupListLink,
            },
            text: "Rechercher un produit",
            isActive: hasPathnameThisMatch(pathname, startupListLink),
        },
        {
            linkProps: {
                href: startupCreateLink,
            },
            text: "Créer une fiche produit",
            isActive: hasPathnameThisMatch(pathname, startupCreateLink),
        },
    ];

    const MenuItems: ItemLink[] = [
        {
            isActive: hasPathnameThisMatch(pathname, accountLink),
            linkProps: {
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

    const tree = findActiveItem(MenuItems);
    return (
        <>
            <div className="fr-col-12 fr-col-md-3 fr-col-lg-3">
                <SideMenu
                    align="left"
                    burgerMenuButtonText="Dans cette rubrique"
                    items={MenuItems}
                    title="Espace-Membre"
                />
            </div>
            <div className="fr-col-12 fr-col-md-9 fr-col-lg-9">
                <Breadcrumb
                    currentPageLabel={tree[tree.length - 1]?.text}
                    homeLinkProps={{
                        href: "/",
                    }}
                    segments={tree
                        .slice(0, tree.length - 1)
                        .filter((segment) => segment.linkProps?.href)
                        .map((segment) => ({
                            label: segment.text,
                            linkProps: {
                                href: segment.linkProps.href,
                            },
                        }))}
                />
                {children}
            </div>
        </>
    );
}
