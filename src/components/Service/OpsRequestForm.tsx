"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { submitOpsRequest } from "@/app/api/services/ops/actions";
import {
  opsRequestSchema,
  opsRequestSchemaType,
} from "@/models/actions/opsRequest";
import { AlertMessageType } from "@/models/common";
import {
  OPS_DEMANDE_CHOICES,
  OPS_DEMANDE_FIELDS,
  OPS_FIELDS,
} from "@/models/ops";

interface OpsRequestFormProps {
  defaultValues?: Partial<opsRequestSchemaType>;
}

export const OpsRequestForm = ({ defaultValues }: OpsRequestFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<opsRequestSchemaType>({
    resolver: zodResolver(opsRequestSchema),
    mode: "onChange",
    defaultValues,
  });
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>();

  const demande = watch("demande");
  const fields = demande ? (OPS_DEMANDE_FIELDS[demande] ?? []) : [];

  const onSubmit = async (data: opsRequestSchemaType) => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setAlertMessage(null);
    const res = await submitOpsRequest(data);
    if (res.success) {
      setAlertMessage({
        title: "Demande envoyée",
        message:
          "Ta demande d'OPS a bien été enregistrée. L'équipe ops va la traiter.",
        type: "success",
      });
      window.scrollTo({ top: 20, behavior: "smooth" });
      setTimeout(() => router.push("/services"), 1500);
    } else {
      setAlertMessage({
        title: "Une erreur est survenue",
        message: res.message || "",
        type: "warning",
      });
      window.scrollTo({ top: 20, behavior: "smooth" });
    }
    setIsSaving(false);
  };

  return (
    <>
      {!!alertMessage && (
        <Alert
          className="fr-mb-8v"
          severity={alertMessage.type}
          closable={false}
          title={alertMessage.title}
          description={alertMessage.message}
        />
      )}
      <p className="fr-text--sm">
        Si votre type de demande n'apparaît pas dans les suggestions, posez
        directement vos questions sur le canal ~incubateur-ops.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Quel est ton identifiant Tchap ?"
          hintText="Ton identifiant Tchap (e.g. prenom.nom). Tu peux le retrouver dans ton profil Tchap."
          state={errors.tchapId ? "error" : undefined}
          stateRelatedMessage={errors.tchapId?.message}
          nativeInputProps={{
            placeholder: "prenom.nom",
            ...register("tchapId"),
          }}
        />

        <Input
          label="Quel est ton email ?"
          state={errors.email ? "error" : undefined}
          stateRelatedMessage={errors.email?.message}
          nativeInputProps={{
            type: "email",
            placeholder: "prenom.nom@beta.gouv.fr",
            ...register("email"),
          }}
        />

        <RadioButtons
          legend="Quelle est ta demande ?"
          state={errors.demande ? "error" : undefined}
          stateRelatedMessage={errors.demande?.message}
          options={OPS_DEMANDE_CHOICES.map((choice) => ({
            label: choice,
            nativeInputProps: {
              value: choice,
              ...register("demande"),
            },
          }))}
        />

        {fields.map((key) => {
          const field = OPS_FIELDS[key];
          const error = errors[key];
          if (field.type === "textarea") {
            return (
              <Input
                key={key}
                label={field.label}
                hintText={field.hint}
                textArea
                state={error ? "error" : undefined}
                stateRelatedMessage={error?.message}
                nativeTextAreaProps={{ ...register(key) }}
              />
            );
          }
          return (
            <Input
              key={key}
              label={field.label}
              hintText={field.hint}
              state={error ? "error" : undefined}
              stateRelatedMessage={error?.message}
              nativeInputProps={{
                type: field.type === "email" ? "email" : "text",
                ...register(key),
              }}
            />
          );
        })}

        <Input
          label="Si ta demande ne concerne pas une SE, merci de préciser le projet pour lequel tu réalises cette demande."
          state={errors.projet ? "error" : undefined}
          stateRelatedMessage={errors.projet?.message}
          nativeInputProps={{ ...register("projet") }}
        />

        <input type="hidden" {...register("prenomNom")} />

        <Button
          className={fr.cx("fr-mt-3w")}
          disabled={isSaving}
          nativeButtonProps={{ type: "submit", disabled: isSubmitting }}
        >
          {isSubmitting ? "Envoi en cours..." : "Envoyer"}
        </Button>
      </form>
    </>
  );
};
