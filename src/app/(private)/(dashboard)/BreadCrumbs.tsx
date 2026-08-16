"use client";
import { routes, routeTitles } from "@/lib/routes";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

import { useInfoContext } from "@/app/BreadCrumbProvider";
import { hasPathnameThisMatch, hasPathnameThisRegex } from "@/lib/url";
import React from "react";

const isCurrentPath = (pathname, rootPath) => pathname.startsWith(rootPath);

export function BreadCrumbs() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const { currentPage, currentItemId } = useInfoContext();

  const accountLink = routes["account"]();
  const communityLink = routes["community"]();
  const communityCreateMemberLink = routes["communityCreateMember"]();
  const startupListLink = routes["startupList"]();

  const startupCreateLink = routes["startupCreate"]();
  const incubatorListLink = routes["incubatorList"]();
  const incubatorCreateLink = routes["incubatorCreate"]();

  const organizationListLink = routes["organizationList"]();
  const organizationCreateLink = routes["organizationCreate"]();
  const teamListLink = routes["teamList"]();
  const teamCreateLink = routes["teamCreate"]();

  const accountEditBaseInfoLink = routes["accountEditBaseInfo"]();

  const metabaseLink = routes["metabase"]();
  const serviceLink = "/services";
  const formationLink = routes["formationList"]();
  const eventsLink = routes["eventsList"]();
  const formationDetailLink = routes["formationDetails"]();
  const verifyLink = routes["verifyMember"]();

  const MenuItems: ItemLink[] = [
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
            routes["startupDetails"]({
              startupId: currentItemId || "",
            }),
          text: currentPage,
          isActive: hasPathnameThisRegex(pathname, "^/startups/[^/]+"),
          items: [
            {
              href: routes["startupDetailsEdit"]({
                startupId: "none",
              }),
              text: "Modifier la fiche",
              isActive: false,
            },
            {
              href: routes["startupDocs"]({
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
          href: communityLink,
          text: "Membres",
          isActive: hasPathnameThisMatch(pathname, communityLink),
          items: [
            {
              href: communityCreateMemberLink,
              text: routeTitles.communityCreateMember(),
              isActive: hasPathnameThisMatch(
                pathname,
                communityCreateMemberLink,
              ),
            },
            {
              href: () =>
                routes["communityMember"]({
                  username: currentItemId || "",
                }),
              text: currentPage,
              isActive: hasPathnameThisRegex(
                pathname,
                "^/community/[a-zA-Z]+.[a-zA-Z]+",
              ),
              items: [
                {
                  href: pathname,
                  text: "Mise à jour de la fiche",
                  isActive: hasPathnameThisRegex(
                    pathname,
                    "^/community/[^/]+/update",
                  ),
                },
                {
                  href: pathname,
                  text: "Mise à jour de la fiche",
                  isActive: hasPathnameThisRegex(
                    pathname,
                    "^/community/[^/]+/admin-update",
                  ),
                },
                {
                  href: pathname,
                  text: "Validation de la fiche",
                  isActive: hasPathnameThisRegex(
                    pathname,
                    "^/community/[^/]+/validate",
                  ),
                },
              ],
            },
          ],
        },
        {
          href: incubatorListLink,
          text: "Incubateurs",
          isActive: hasPathnameThisMatch(pathname, incubatorListLink),
          items: [
            // La creation d'incubateur est reservee aux admins : proposer le
            // lien a tout le monde menerait a une page qui redirige.
            ...(session?.user?.isAdmin
              ? [
                  {
                    href: incubatorCreateLink,
                    text: routeTitles.incubatorCreate(),
                    isActive: hasPathnameThisMatch(
                      pathname,
                      incubatorCreateLink,
                    ),
                  },
                ]
              : []),
            {
              href: () =>
                routes["incubatorDetails"]({
                  incubatorId: currentItemId || "",
                }),
              text: currentPage,
              isActive: hasPathnameThisRegex(
                pathname,
                "^/incubators/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
              ),
              items: [
                {
                  href: pathname,
                  text: "Modifier la fiche",
                  isActive: hasPathnameThisRegex(
                    pathname,
                    "^/incubators/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$",
                  ),
                },
                {
                  href: pathname,
                  text: routeTitles.incubatorApiKeys(),
                  isActive: hasPathnameThisRegex(
                    pathname,
                    "^/incubators/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/api-keys$",
                  ),
                },
              ],
            },
          ],
        },
        {
          href: routes.adminApiKeys(),
          text: routeTitles.admin(),
          isActive: hasPathnameThisMatch(pathname, "/admin"),
          items: [
            {
              href: routes.adminApiKeys(),
              text: routeTitles.adminApiKeys(),
              isActive: hasPathnameThisMatch(pathname, routes.adminApiKeys()),
            },
          ],
        },
        {
          href: organizationListLink,
          text: "Sponsors",
          isActive: hasPathnameThisMatch(pathname, organizationListLink),
          items: [
            {
              href: organizationCreateLink,
              text: routeTitles.organizationCreate(),
              isActive: hasPathnameThisMatch(pathname, organizationCreateLink),
            },
            {
              href: () => {
                return routes["organizationDetails"]({
                  organizationId: currentItemId || currentPage,
                });
              },
              text: currentPage,
              isActive: hasPathnameThisRegex(
                pathname,
                "^/organizations/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
              ),
              items: [
                {
                  href: pathname,
                  text: "Modifier la fiche",
                  isActive: hasPathnameThisRegex(
                    pathname,
                    "^/organizations/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$",
                  ),
                },
              ],
            },
          ],
        },
        {
          href: teamListLink,
          text: "Équipes incubateur",
          isActive: hasPathnameThisMatch(pathname, teamListLink),
          items: [
            {
              href: teamCreateLink,
              text: routeTitles.teamCreate(),
              isActive: hasPathnameThisMatch(pathname, teamCreateLink),
            },
            {
              href: () =>
                routes["teamDetails"]({
                  teamId: currentItemId || currentPage,
                }),
              text: currentPage,
              isActive: hasPathnameThisRegex(
                pathname,
                "^/teams/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
              ),
              items: [
                {
                  href: pathname,
                  text: "Modifier la fiche",
                  isActive: hasPathnameThisRegex(
                    pathname,
                    "^/teams/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/info-form$",
                  ),
                },
              ],
            },
          ],
        },
        {
          href: metabaseLink,
          text: "Observatoire",
          isActive: hasPathnameThisMatch(pathname, metabaseLink),
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
          isActive: hasPathnameThisMatch(pathname, accountEditBaseInfoLink),
        },
      ],
    },
    {
      href: eventsLink,
      text: routeTitles.eventsList(),
      isActive: hasPathnameThisMatch(pathname, eventsLink),
    },
    {
      href: formationLink,
      text: routeTitles.formationList(),
      isActive: isCurrentPath(pathname, formationLink),
      items: [
        {
          href: pathname,
          text: currentPage || pathname,
          isActive: hasPathnameThisRegex(pathname, formationDetailLink),
        },
      ],
    },
    {
      href: serviceLink,
      text: routeTitles.serviceList(),
      isActive: hasPathnameThisMatch(pathname, serviceLink),
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
    )
  );
}
