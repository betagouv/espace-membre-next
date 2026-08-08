"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import * as Sentry from "@sentry/nextjs";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import SESelect, { StartupType } from "@/components/SESelect";
import { submitOpsRequest } from "@/app/api/services/ops/actions";
import {
  opsRequestSchema,
  opsRequestSchemaType,
} from "@/models/actions/opsRequest";
import { AlertMessageType } from "@/models/common";
import {
  OPS_DEMANDE_CHOICES,
  OPS_DEMANDE_FIELDS,
  OPS_DEMANDE_TYPE,
  OPS_FIELDS,
} from "@/models/ops";
import Link from "next/link";

// Doc de l'embarquement dev : prérequis obligatoire avant toute commande de
// ressources.
const EMBARQUEMENT_DEV_DOC_URL =
  "https://doc.incubateur.net/communaute/travailler-a-beta-gouv/embarquement-dev";

// Canal Tchap où l'équipe ops traite les demandes : lien de suivi donné à la
// soumission du formulaire.
const OPS_TCHAP_CHANNEL_URL =
  "https://tchap.gouv.fr/#/room/!VxFWdbcSlumKPvpVRP:agent.dinum.tchap.gouv.fr";

interface OpsRequestFormProps {
  defaultValues?: Partial<opsRequestSchemaType>;
  startupOptions?: StartupType[];
}

export const OpsRequestForm = ({
  defaultValues,
  startupOptions = [],
}: OpsRequestFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<opsRequestSchemaType>({
    resolver: zodResolver(opsRequestSchema),
    mode: "onChange",
    defaultValues,
  });
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
    try {
      const res = await submitOpsRequest(data);
      if (res?.success) {
        setAlertMessage({
          title: "Demande prise en compte",
          message: (
            <>
              Ta demande d&apos;OPS a bien été prise en compte. L&apos;équipe
              ops va la traiter. Tu peux suivre son avancement sur le canal{" "}
              <a
                className={fr.cx(
                  "fr-link",
                  "fr-link--icon-right",
                  "fr-icon-external-link-line",
                )}
                href={OPS_TCHAP_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Demandes-OPS
              </a>{" "}
              sur Tchap.
            </>
          ),
          type: "success",
        });
        // Pas de redirection automatique : l'utilisateur doit avoir le temps de
        // lire la confirmation et de cliquer sur le lien du canal de suivi.
        window.scrollTo({ top: 20, behavior: "smooth" });
      } else {
        setAlertMessage({
          title: "Une erreur est survenue",
          message:
            res?.message ||
            "La demande n'a pas pu être envoyée. Recharge la page et réessaie.",
          type: "warning",
        });
        window.scrollTo({ top: 20, behavior: "smooth" });
      }
    } catch (e) {
      Sentry.captureException(e);
      setAlertMessage({
        title: "Une erreur est survenue",
        message:
          "La demande n'a pas pu être envoyée. Recharge la page et réessaie.",
        type: "warning",
      });
      window.scrollTo({ top: 20, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
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
      <Alert
        className="fr-mb-4v"
        severity="warning"
        small
        description={
          <>
            Attention, pour pouvoir commander des ressources, tu dois{" "}
            <strong>obligatoirement</strong> avoir suivi{" "}
            <a
              className={fr.cx(
                "fr-link",
                "fr-link--icon-right",
                "fr-icon-external-link-line",
              )}
              href={EMBARQUEMENT_DEV_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              l&apos;embarquement dev
            </a>
            . Si ce n&apos;est pas le cas, merci de prendre connaissance de la
            doc indiquée et de t&apos;inscrire à la prochaine session avant de
            faire ta demande. Ton produit doit également avoir sa fiche produit
            publiée pour bénéficier de ces services.
          </>
        }
      />
      <p className="fr-text--sm">
        Si votre type de demande n'apparaît pas dans les suggestions, posez
        directement vos questions sur le{" "}
        <Link href={OPS_TCHAP_CHANNEL_URL}>canal Tchap demandes-OPS</Link>
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Identifiant Tchap et email : préremplis et masqués, mais envoyés à Grist. */}
        <input type="hidden" {...register("tchapId")} />
        <input type="hidden" {...register("email")} />

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

        {demande === OPS_DEMANDE_TYPE.SCALINGO_APP && (
          <Alert
            className="fr-mb-4v"
            severity="error"
            small
            description="Attention si votre startup fait partie de la fabrique de l'écologie, ou que votre incubateur dispose de son propre compte scalingo, merci de contacter directement votre référent.e tech."
          />
        )}

        {fields.map((key) => {
          const field = OPS_FIELDS[key];
          const error = errors[key];
          if (field.type === "startup") {
            return (
              <div key={key} className={fr.cx("fr-mb-3w")}>
                <SESelect
                  label={field.label}
                  hint={field.hint}
                  isMulti={false}
                  inputReadOnly
                  placeholder="Sélectionne un produit"
                  startups={startupOptions}
                  state={error ? "error" : "default"}
                  stateMessageRelated={error?.message}
                  onChange={(startup) => {
                    setValue("startupId", startup?.value ?? "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                    setValue("startupName", startup?.label ?? "", {
                      shouldDirty: true,
                    });
                  }}
                />
                <input type="hidden" {...register("startupName")} />
              </div>
            );
          }
          if (field.type === "select") {
            return (
              <RadioButtons
                key={key}
                legend={field.label}
                hintText={field.hint}
                state={error ? "error" : undefined}
                stateRelatedMessage={error?.message}
                options={(field.options ?? []).map((option) => ({
                  label:
                    option === field.defaultValue
                      ? `${option} (recommandé)`
                      : option,
                  nativeInputProps: {
                    value: option,
                    defaultChecked: option === field.defaultValue,
                    ...register(key),
                  },
                }))}
              />
            );
          }
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
            <div key={key}>
              <Input
                label={field.label}
                hintText={field.hint}
                state={error ? "error" : undefined}
                stateRelatedMessage={error?.message}
                nativeInputProps={{
                  type: field.type === "email" ? "email" : "text",
                  ...register(key),
                }}
              />
              {!!field.warnOnInput && !!watch(key) && (
                <Alert
                  className={fr.cx("fr-mt-1v", "fr-mb-2v")}
                  severity="warning"
                  small
                  description={field.warnOnInput}
                />
              )}
            </div>
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
