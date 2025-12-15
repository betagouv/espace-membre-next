import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { Table } from "@codegouvfr/react-dsfr/Table";

import { memberBaseInfoSchemaType } from "@/models/member";
import { getLastMissionDate, getFirstMissionDate } from "@/utils/member";
import Button from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";
import MemberSelect from "../MemberSelect";
import { redirect, useRouter } from "next/navigation";

export function MemberTable({
  members,
  startup_id,
  canEditMembers = false,
}: {
  members: memberBaseInfoSchemaType[];
  startup_id: string;
  canEditMembers?: boolean;
}) {
  const onRemoveMemberClick = (e, member: memberBaseInfoSchemaType) => {
    const confirmed = confirm(
      `Voulez-vous vraiment supprimer ${member.fullname} de l'équipe ?`,
    );
    if (confirmed) {
      // TODO: action
      console.log("CONFIRMED onRemoveMemberClick", member);
    }
  };
  return (
    <Table
      fixed
      data={members
        .sort((a, b) => a.fullname.localeCompare(b.fullname))
        .map((member: memberBaseInfoSchemaType, index: number) => [
          <a key={index} href={`/community/${member.username}`}>
            {member.fullname}
          </a>,
          member.role,
          getFirstMissionDate(
            member.missions.filter((mission) =>
              (mission.startups || []).includes(startup_id),
            ),
          ) || "",
          getLastMissionDate(
            member.missions.filter((mission) =>
              (mission.startups || []).includes(startup_id),
            ),
          ) || "",
          canEditMembers && (
            <i
              onClick={(e) => onRemoveMemberClick(e, member)}
              className={fr.cx("fr-icon--sm", "ri-delete-bin-2-fill")}
              style={{ cursor: "pointer" }}
            ></i>
          ),
        ])}
      headers={["Nom", "Role", "Date d'arrivée", "Date de fin", "Actions"]}
    />
  );
}

export const StartupMembers = ({
  startupInfos,
  members,
  allMembers,
  canEditMembers,
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const router = useRouter();

  const activeMembers = members.filter((member) =>
    member.missions.find(
      (m) =>
        m.startups?.includes(startupInfos.uuid) &&
        (!m.end || m.end >= new Date()),
    ),
  );
  const previousMembers = members.filter((member) =>
    member.missions.find(
      (m) =>
        m.startups?.includes(startupInfos.uuid) && m.end && m.end < new Date(),
    ),
  );
  const onAddMemberClick = (e) => {
    setShowAddMember(true);
  };

  const onAddMember = (member) => {
    const confirmed = confirm(
      `Voulez-vous vraiment ajouter ${member.fullname} à l'équipe ?`,
    );
    if (confirmed) {
      console.log("CONFIRMED onAddMember", member);
      // TODO: action
    }
  };
  return (
    <>
      <div className={fr.cx("fr-mb-2w")}>
        <a href={`mailto:${startupInfos.contact}`}>
          <i className={fr.cx("fr-icon--sm", "fr-icon-mail-fill")} /> Contacter
          l'équipe
        </a>
      </div>
      {(activeMembers.length && (
        <Accordion
          titleAs="h2"
          label="Membres actifs"
          expanded={true}
          onExpandedChange={() => {}}
        >
          <MemberTable
            members={activeMembers}
            startup_id={startupInfos.uuid}
            canEditMembers={canEditMembers}
          />
          {canEditMembers && (
            <>
              <Button
                onClick={(e) => onAddMemberClick(e)}
                iconId="ri-add-box-fill"
              >
                Ajouter des membres
              </Button>
              {showAddMember && (
                <div className={fr.cx("fr-mt-2w")}>
                  <MemberSelect
                    members={[
                      {
                        fullname: "   ➕ Créer un nouveau membre",
                        username: "create-member",
                      },
                      ...allMembers,
                    ]}
                    defaultValue={undefined}
                    name="username"
                    label="Membre à ajouter"
                    multiple={false}
                    placeholder="Sélectionne un nouveau membre"
                    onChange={(option) => {
                      console.log("onChange", option);
                      if (!option) return;
                      if (option.value === "create-member") {
                        const confirmed = confirm(
                          "Inviter un nouveau membre dans la communauté ?",
                        );
                        if (confirmed) {
                          router.push("/community/create");
                        }
                        return;
                      }
                      onAddMember({
                        fullname: option.label,
                        username: option.value,
                      });
                    }}
                    valueKey={"username"}
                  ></MemberSelect>
                </div>
              )}
            </>
          )}
        </Accordion>
      )) || (
        <div className={fr.cx("fr-my-4w")}>
          <i className={fr.cx("fr-icon--sm", "fr-icon-warning-fill")} /> Aucun
          membre actif actuellement.
        </div>
      )}
      {(previousMembers.length && (
        <Accordion
          titleAs="h2"
          label="Anciens membres"
          expanded={activeMembers.length === 0}
          onExpandedChange={() => {}}
        >
          <MemberTable
            members={previousMembers}
            startup_id={startupInfos.uuid}
          />
        </Accordion>
      )) ||
        null}
    </>
  );
};
