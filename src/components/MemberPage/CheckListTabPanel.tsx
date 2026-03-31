import { useState, useEffect, ReactNode } from "react";

import { fr } from "@codegouvfr/react-dsfr";

import Checklist from "../Checklist";
import ProgressBar from "../ProgressBar";
import { memberWrapperSchemaType } from "@/models/member";
import { checklistSchemaType } from "@/models/checklist";
import { userEventSchemaType } from "@/models/userEvent";
import { computeProgress } from "@/utils/checklists/computeProgress";

export const ChecklistTabPanel = ({
  userEvents,
  userInfos,
  checklistObject,
  intro,
  readOnly,
  offset = 0,
}: {
  userEvents: userEventSchemaType[];
  checklistObject: checklistSchemaType;
  userInfos: memberWrapperSchemaType["userInfos"];
  intro: ReactNode;
  readOnly: boolean;
  offset?: number;
}) => {
  const [userEventIds, setUserEventIds] = useState<string[]>(
    userEvents
      .filter((event) => event.date !== null)
      .map((event) => event.field_id),
  );
  const [progress, setProgress] = useState<number>(
    computeProgress(userEventIds, checklistObject, offset),
  );
  useEffect(() => {
    setProgress(computeProgress(userEventIds, checklistObject, offset));
  }, [userEventIds, checklistObject]);
  return (
    <>
      {intro}
      <ProgressBar
        progress={progress}
        className={fr.cx("fr-mt-4w", "fr-mb-4w")}
      />
      <Checklist
        readOnly={readOnly}
        userUuid={userInfos.uuid}
        userEventIds={userEventIds}
        handleUserEventIdsChange={setUserEventIds}
        sections={checklistObject}
        domaine={userInfos.domaine}
      />
    </>
  );
};
