"use client";
import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

import { MissionsEditor } from "../BaseInfoUpdatePage/MissionsEditor";
import { safeUpdateMemberMissions } from "@/app/api/member/actions";
import {
  updateMemberMissionsSchema,
  updateMemberMissionsSchemaType,
} from "@/models/actions/member";
import { EmailStatusCode, memberBaseInfoSchemaType } from "@/models/member";
import { Option } from "@/models/misc";
import routes, { computeRoute } from "@/routes/routes";
// data from secretariat API
export interface BaseInfoUpdateProps {
  userInfos: memberBaseInfoSchemaType;
  startupOptions: Option[];
}

export const MemberUpdate = ({
  userInfos,
  startupOptions,
}: BaseInfoUpdateProps) => {
  const defaultValues: updateMemberMissionsSchemaType = {
    missions: userInfos.missions,
    memberUuid: userInfos.uuid,
  };
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting, isValid },
    setValue,
    trigger,
    control,
  } = useForm<updateMemberMissionsSchemaType>({
    resolver: zodResolver(updateMemberMissionsSchema),
    mode: "onChange",
    defaultValues,
  });

  const session = useSession();

  const [alertMessage, setAlertMessage] = React.useState<{
    title: string;
    message: NonNullable<React.ReactNode>;
    type: "success" | "warning";
  } | null>();
  const [isSaving, setIsSaving] = React.useState(false);

  const onSubmit = async (data: updateMemberMissionsSchemaType) => {
    //console.log("onSubmit", input);
    if (isSaving) {
      return;
    }
    if (!isValid) {
      console.log("invalid");
      return;
    }
    setIsSaving(true);
    setAlertMessage(null);
    const res = await safeUpdateMemberMissions(data);
    setIsSaving(false);
    if (res.success) {
      setAlertMessage({
        title: `Modifications enregistrées`,
        message: `Les missions ont été mises à jour.`,
        type: "success",
      });
    } else {
      console.error(res.message);
      setAlertMessage({
        title: "Erreur",
        message: res.message || "",
        type: "warning",
      });
    }
    document.body.scrollIntoView();
  };

  return (
    <>
      <div className={fr.cx("fr-mb-5w")}>
        <h1>Mise à jour des infomations de {userInfos.fullname}</h1>
        <br />
        <br />
        {!!alertMessage && (
          <Alert
            className="fr-mb-8v"
            severity={alertMessage.type}
            description={alertMessage.message}
            closable={false}
            title={alertMessage.title}
          />
        )}
        <Alert
          className="fr-mb-8v"
          severity={"info"}
          closable={false}
          title={`Après la mise à jour de sa date de fin de mission, ${userInfos.fullname} doit redéfinir le mot de passe de son email dans son Espace Membre pour le réactiver.`}
        />
        <form
          onSubmit={handleSubmit(onSubmit)}
          aria-label="Modifier mes informations"
        >
          <h3>Missions</h3>
          <p>
            Prolonge une mission existante ou créer un nouvelle missions pour ce
            membre fin de réactiver ses accès.
          </p>
          <MissionsEditor
            control={control}
            trigger={trigger}
            setValue={setValue}
            register={register}
            startupOptions={startupOptions}
            errors={errors.missions || []}
          />
          <Button
            className={fr.cx("fr-mt-3w")}
            children={
              isSubmitting ? `Enregistrement en cours...` : `Enregistrer`
            }
            nativeButtonProps={{
              type: "submit",
              disabled: !isDirty || isSubmitting,
            }}
          />
        </form>
      </div>
    </>
  );
};
