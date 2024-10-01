import Table from "@codegouvfr/react-dsfr/Table";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { fr } from "@codegouvfr/react-dsfr/fr";

import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale/fr";

import { MemberPageProps } from "./MemberPage";

export const MemberMissions = ({
    startups,
}: {
    startups: MemberPageProps["startups"];
}) => {
    return (
        <Table
            className="tbl-missions"
            fixed
            headers={["Startup", "Début", "Fin"]}
            data={startups.map((startup) => [
                <Tag
                    key="startup"
                    className={fr.cx("fr-mr-1v")}
                    linkProps={{
                        href: `/startups/${startup.uuid}`,
                    }}
                >
                    {startup.name}
                </Tag>,
                (startup.start &&
                    format(startup.start, "dd/MM/yyyy", {
                        locale: frLocale,
                    })) ||
                    "-",
                (startup.end &&
                    format(startup.end, "dd/MM/yyyy", {
                        locale: frLocale,
                    })) ||
                    "-",
            ])}
        ></Table>
    );
};
