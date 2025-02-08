import { fr } from "@codegouvfr/react-dsfr/fr";
import Table from "@codegouvfr/react-dsfr/Table";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";

import { MemberPageProps } from "./MemberPage";
import { linkRegistry } from "@/utils/routes/registry";

export const MemberMissions = ({
    startups,
    userInfos,
}: {
    startups: MemberPageProps["startups"];
    userInfos: MemberPageProps["userInfos"];
}) => {
    const missions = userInfos.missions.flatMap((m) =>
        m.startups?.length
            ? m.startups.map((s) => {
                  const startup = startups.find((s2) => s2.uuid === s);
                  return {
                      start: m.start,
                      end: m.end,
                      uuid: s,
                      name: startup?.name,
                      url:
                          linkRegistry.get("startupDetails", {
                              startupId: startup?.uuid,
                          }) || "#",
                  };
              })
            : [
                  {
                      start: m.start,
                      end: m.end,
                      uuid: "",
                      name: userInfos.teams?.length
                          ? userInfos.teams.map((t) => `${t.ghid}`).join(",")
                          : userInfos.role,
                      url:
                          (userInfos.teams?.length &&
                              linkRegistry.get("teamDetails", {
                                  teamId: userInfos.teams[0].uuid,
                              })) ||
                          "#",
                  },
              ]
    );

    //console.log("missions", missions);
    //console.log("userInfos.missions", userInfos.missions);

    return (
        (missions.length && (
            <Table
                className="tbl-missions"
                fixed
                headers={["Startup", "Début", "Fin"]}
                data={missions.map((mission) => [
                    mission ? (
                        <Tag
                            key="startup"
                            className={fr.cx("fr-mr-1v")}
                            linkProps={{
                                href: mission.url,
                            }}
                        >
                            {mission.name}
                        </Tag>
                    ) : (
                        "-"
                    ),
                    (mission.start &&
                        format(mission.start, "dd/MM/yyyy", {
                            locale: frLocale,
                        })) ||
                        "-",
                    (mission.end &&
                        format(mission.end, "dd/MM/yyyy", {
                            locale: frLocale,
                        })) ||
                        "-",
                ])}
            ></Table>
        )) || <>Aucune information trouvée sur les missions 😰</>
    );
};
