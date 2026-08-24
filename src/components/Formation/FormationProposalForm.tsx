"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import Select from "@codegouvfr/react-dsfr/SelectNext";
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
  FORMATION_DUREES,
  FORMATION_MODALITE_CHOICES,
  FORMATION_THEMATIQUES,
} from "@/models/formationsGrist";
import { routes } from "@/lib/routes";

// Un input number ou url vidé renvoie "" : on le transforme en undefined pour
// que les champs facultatifs restent facultatifs.
const emptyAsUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const FormationProposalForm = ({
  isAnimation,
  defaultValues,
}: {
  isAnimation: boolean;
  defaultValues?: Partial<formationProposalSchemaType>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<formationProposalSchemaType>({
    resolver: zodResolver(formationProposalSchema),
    mode: "onChange",
    defaultValues: { thematiques: [], audience: [], ...defaultValues },
  });
  const router = useRouter();
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>(null);

  const onSubmit = async (data: formationProposalSchemaType) => {
    // react-hook-form rend une FileList : on n'envoie que le premier fichier,
    // et rien du tout si le champ est vide.
    const fileList = data.image as FileList | undefined;
    const res = await submitFormationProposal({
      ...data,
      image: fileList?.[0],
    });
    if (res.success) {
      setAlertMessage({
        title: isAnimation ? "Formation créée" : "Proposition envoyée",
        message: isAnimation
          ? "La formation est ajoutée au catalogue. Tu peux maintenant planifier des sessions dans Grist."
          : "Merci ! L'équipe d'animation va examiner ta proposition et revenir vers toi.",
        type: "success",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => router.push(routes.formationList()), 2500);
    } else {
      setAlertMessage({
        title: "Une erreur est survenue",
        message: res.message || "",
        type: "warning",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        label="Sujet de la formation"
        state={errors.titre ? "error" : "default"}
        stateRelatedMessage={errors.titre?.message}
        nativeInputProps={{ ...register("titre") }}
      />

      <Input
        label="Description de la formation"
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
        legend="Catégorie"
        state={errors.thematiques ? "error" : "default"}
        stateRelatedMessage={errors.thematiques?.message}
        options={FORMATION_THEMATIQUES.map((thematique) => ({
          label: thematique,
          nativeInputProps: { value: thematique, ...register("thematiques") },
        }))}
      />

      <Checkbox
        legend="Audience cible"
        hintText="Tu peux en sélectionner plusieurs."
        state={errors.audience ? "error" : "default"}
        stateRelatedMessage={errors.audience?.message}
        options={FORMATION_AUDIENCES.map((audience) => ({
          label: audience,
          nativeInputProps: { value: audience, ...register("audience") },
        }))}
      />

      {/* alignItems + fr-mb-0 : le texte d'aide rend une colonne plus haute que
          l'autre, et la marge basse de .fr-input-group varie selon le
          breakpoint — sans ça les deux champs ne sont pas alignés. */}
      <div
        className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-3w")}
        style={{ alignItems: "flex-end" }}
      >
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <Input
            className={fr.cx("fr-mb-0")}
            label="Date de début de formation (facultatif)"
            hintText="Si la date est déjà fixée. Une session sera créée avec la formation."
            state={errors.dateDebut ? "error" : "default"}
            stateRelatedMessage={errors.dateDebut?.message}
            nativeInputProps={{
              type: "datetime-local",
              ...register("dateDebut", { setValueAs: emptyAsUndefined }),
            }}
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <Input
            className={fr.cx("fr-mb-0")}
            label="Date de fin de formation (facultatif)"
            state={errors.dateFin ? "error" : "default"}
            stateRelatedMessage={errors.dateFin?.message}
            nativeInputProps={{
              type: "datetime-local",
              ...register("dateFin", { setValueAs: emptyAsUndefined }),
            }}
          />
        </div>
      </div>

      <Input
        label="Lien de visioconférence administrateur (facultatif)"
        state={errors.lienVisioAdmin ? "error" : "default"}
        stateRelatedMessage={errors.lienVisioAdmin?.message}
        nativeInputProps={{
          type: "url",
          placeholder: "https://",
          ...register("lienVisioAdmin", { setValueAs: emptyAsUndefined }),
        }}
      />

      <div
        className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-3w")}
        style={{ alignItems: "flex-end" }}
      >
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <Select
            className={fr.cx("fr-mb-0")}
            label="Durée (facultatif)"
            state={errors.duree ? "error" : "default"}
            stateRelatedMessage={errors.duree?.message}
            nativeSelectProps={{
              ...register("duree", { setValueAs: emptyAsUndefined }),
            }}
            options={[
              { label: "Sélectionner une durée", value: "" },
              ...FORMATION_DUREES.map((duree) => ({
                label: duree.label,
                value: duree.label,
              })),
            ]}
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <Input
            className={fr.cx("fr-mb-0")}
            label="Limite de participants (facultatif)"
            state={errors.capacite ? "error" : "default"}
            stateRelatedMessage={errors.capacite?.message}
            nativeInputProps={{
              type: "number",
              min: 1,
              step: 1,
              ...register("capacite", {
                setValueAs: (value) =>
                  value === "" || value === null ? undefined : Number(value),
              }),
            }}
          />
        </div>
      </div>

      <Input
        label="Lien du support (facultatif)"
        state={errors.lienSupport ? "error" : "default"}
        stateRelatedMessage={errors.lienSupport?.message}
        nativeInputProps={{
          type: "url",
          placeholder: "https://",
          ...register("lienSupport", { setValueAs: emptyAsUndefined }),
        }}
      />

      <Input
        label="Lien vers le formulaire de feedback (facultatif)"
        hintText="Un formulaire pour savoir comment s'est passée la formation."
        state={errors.lienFeedback ? "error" : "default"}
        stateRelatedMessage={errors.lienFeedback?.message}
        nativeInputProps={{
          type: "url",
          placeholder: "https://",
          ...register("lienFeedback", { setValueAs: emptyAsUndefined }),
        }}
      />

      <Input
        label="Qui animera cette formation ?"
        state={errors.animateur ? "error" : "default"}
        stateRelatedMessage={errors.animateur?.message}
        nativeInputProps={{ ...register("animateur") }}
      />

      <Input
        label="Adresse Tchap de l'animateur·ice (facultatif)"
        hintText="L'adresse professionnelle utilisée sur Tchap, pour pouvoir la contacter."
        state={errors.animateurTchap ? "error" : "default"}
        stateRelatedMessage={errors.animateurTchap?.message}
        nativeInputProps={{
          type: "email",
          placeholder: "prenom.nom@beta.gouv.fr",
          ...register("animateurTchap", { setValueAs: emptyAsUndefined }),
        }}
      />

      <Input
        label="Email de l'organisateur·trice"
        hintText="Il ou elle sera averti·e dès que la formation sera complète."
        state={errors.emailOrganisateur ? "error" : "default"}
        stateRelatedMessage={errors.emailOrganisateur?.message}
        nativeInputProps={{
          type: "email",
          ...register("emailOrganisateur"),
        }}
      />

      <Upload
        label="Image ou bannière de la formation (facultatif)"
        hint="Une illustration pour le catalogue. JPG ou PNG, 5 Mo maximum."
        state={errors.image ? "error" : "default"}
        stateRelatedMessage={errors.image?.message?.toString()}
        nativeInputProps={{
          accept: "image/*",
          ...register("image"),
        }}
      />

      <Checkbox
        legend="Souhaites-tu que nous gérions les inscriptions ?"
        hintText="Si oui : lien d'inscription proposé aux participants, relance la veille de la formation, et un mail dès que la formation est complète."
        options={[
          {
            label: "Oui, je veux bien",
            nativeInputProps: { ...register("gestionInscriptions") },
          },
        ]}
      />

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
