"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { submitFormationProposal } from "@/app/api/formations/actions";
import { AlertMessageType } from "@/models/common";
import {
  formationProposalSchema,
  formationProposalSchemaType,
} from "@/models/actions/formationProposal";
import {
  FORMATION_AUDIENCES,
  FORMATION_MODALITE_CHOICES,
  FORMATION_THEMATIQUES,
} from "@/models/formationsGrist";
import { routes } from "@/lib/routes";

export const FormationProposalForm = ({
  isAnimation,
}: {
  isAnimation: boolean;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<formationProposalSchemaType>({
    resolver: zodResolver(formationProposalSchema),
    mode: "onChange",
    defaultValues: { thematiques: [], audience: [] },
  });
  const router = useRouter();
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>(null);

  const onSubmit = async (data: formationProposalSchemaType) => {
    const res = await submitFormationProposal(data);
    if (res.success) {
      setAlertMessage({
        title: isAnimation ? "Formation créée" : "Proposition envoyée",
        message: isAnimation
          ? "La formation est ajoutée au catalogue. Tu peux maintenant planifier des sessions dans Grist."
          : "Merci ! L'équipe d'animation va examiner ta proposition et revenir vers toi.",
        type: "success",
      });
      setTimeout(() => router.push(routes.formationList()), 2500);
    } else {
      setAlertMessage({
        title: "Une erreur est survenue",
        message: res.message || "",
        type: "warning",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {!!alertMessage && (
        <Alert
          className={fr.cx("fr-mb-4w")}
          severity={alertMessage.type}
          title={alertMessage.title}
          description={alertMessage.message}
        />
      )}

      <Input
        label="Titre de la formation"
        state={errors.titre ? "error" : "default"}
        stateRelatedMessage={errors.titre?.message}
        nativeInputProps={{ ...register("titre") }}
      />

      <Input
        label="Description"
        hintText="Objectifs, contenu, prérequis éventuels."
        textArea
        state={errors.description ? "error" : "default"}
        stateRelatedMessage={errors.description?.message}
        nativeTextAreaProps={{ rows: 5, ...register("description") }}
      />

      <RadioButtons
        legend="Modalité"
        state={errors.modalite ? "error" : "default"}
        stateRelatedMessage={errors.modalite?.message}
        options={FORMATION_MODALITE_CHOICES.map((modalite) => ({
          label: modalite,
          nativeInputProps: { value: modalite, ...register("modalite") },
        }))}
      />

      <Checkbox
        legend="Thématiques"
        state={errors.thematiques ? "error" : "default"}
        stateRelatedMessage={errors.thematiques?.message}
        options={FORMATION_THEMATIQUES.map((thematique) => ({
          label: thematique,
          nativeInputProps: { value: thematique, ...register("thematiques") },
        }))}
      />

      <Checkbox
        legend="Audience"
        state={errors.audience ? "error" : "default"}
        stateRelatedMessage={errors.audience?.message}
        options={FORMATION_AUDIENCES.map((audience) => ({
          label: audience,
          nativeInputProps: { value: audience, ...register("audience") },
        }))}
      />

      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
          <Input
            label="Capacité (facultatif)"
            hintText="Nombre de places par session."
            state={errors.capacite ? "error" : "default"}
            stateRelatedMessage={errors.capacite?.message}
            nativeInputProps={{
              type: "number",
              min: 1,
              step: 1,
              // Champ vidé -> undefined, sinon z.coerce en ferait un 0.
              ...register("capacite", {
                setValueAs: (value) =>
                  value === "" || value === null ? undefined : Number(value),
              }),
            }}
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
          <Input
            label="Durée en heures (facultatif)"
            state={errors.duree ? "error" : "default"}
            stateRelatedMessage={errors.duree?.message}
            nativeInputProps={{
              type: "number",
              min: 0.5,
              step: 0.5,
              ...register("duree", {
                setValueAs: (value) =>
                  value === "" || value === null ? undefined : Number(value),
              }),
            }}
          />
        </div>
      </div>

      {!isAnimation && (
        <Alert
          className={fr.cx("fr-my-2w")}
          severity="info"
          small
          description="Ta proposition sera examinée par l'équipe d'animation avant d'apparaître au catalogue."
        />
      )}

      <Button
        className={fr.cx("fr-mt-2w")}
        nativeButtonProps={{ type: "submit", disabled: isSubmitting }}
      >
        {isSubmitting
          ? "Envoi en cours..."
          : isAnimation
            ? "Créer la formation"
            : "Proposer la formation"}
      </Button>
    </form>
  );
};
