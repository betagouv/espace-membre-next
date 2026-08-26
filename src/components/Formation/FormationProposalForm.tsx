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
import { FormationImage } from "@/lib/formationsGrist";

// Un input number ou url vidé renvoie "" : on le transforme en undefined pour
// que les champs facultatifs restent facultatifs.
const emptyAsUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const FormationProposalForm = ({
  images = [],
  isAnimation,
  defaultValues,
}: {
  // Illustrations proposées par le document Grist, vide si la banque est
  // indisponible : l'envoi d'un fichier reste alors le seul chemin.
  images?: FormationImage[];
  isAnimation: boolean;
  defaultValues?: Partial<formationProposalSchemaType>;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<formationProposalSchemaType>({
    resolver: zodResolver(formationProposalSchema),
    mode: "onChange",
    defaultValues: { thematiques: [], audience: [], ...defaultValues },
  });
  const imageId = watch("imageId");
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
          : "Merci ! L'équipe animation va examiner ta proposition et revenir vers toi.",
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
            label="Date de la formation"
            hintText="La fin est déduite de la durée."
            state={errors.dateDebut ? "error" : "default"}
            stateRelatedMessage={errors.dateDebut?.message}
            nativeInputProps={{
              type: "datetime-local",
              ...register("dateDebut", { setValueAs: emptyAsUndefined }),
            }}
          />
        </div>
      </div>

      <Input
        label="Lien de visioconférence administrateur"
        hintText="Requis pour une formation en distanciel."
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
            label="Durée"
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
            hintText="Sans limite, les inscriptions restent ouvertes."
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
        label="Email de l'organisateur·trice"
        hintText="Il ou elle sera averti·e dès que la formation sera complète."
        state={errors.emailOrganisateur ? "error" : "default"}
        stateRelatedMessage={errors.emailOrganisateur?.message}
        nativeInputProps={{
          type: "email",
          ...register("emailOrganisateur"),
        }}
      />

      <fieldset className={fr.cx("fr-fieldset")}>
        <legend className={fr.cx("fr-fieldset__legend")}>
          Image ou bannière de la formation
          <span className={fr.cx("fr-hint-text")}>
            Elle illustre la formation au catalogue.
          </span>
        </legend>

        {images.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            {images.map((image) => {
              const choisie = imageId === image.id;
              return (
                <button
                  type="button"
                  key={image.id}
                  aria-pressed={choisie}
                  onClick={() =>
                    // Recliquer sur l'illustration choisie la retire : c'est le
                    // seul moyen de revenir à l'envoi d'un fichier.
                    setValue("imageId", choisie ? "" : image.id, {
                      shouldValidate: true,
                    })
                  }
                  style={{
                    padding: 0,
                    border: choisie
                      ? "3px solid var(--border-active-blue-france)"
                      : "1px solid var(--border-default-grey)",
                    background: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.nom}
                    style={{
                      width: "100%",
                      height: "5.5rem",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <span
                    className={fr.cx("fr-text--xs", "fr-px-1v", "fr-py-1v")}
                    style={{ display: "block" }}
                  >
                    {image.nom}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <input type="hidden" {...register("imageId")} />

        {!imageId && (
          <Upload
            label={
              images.length > 0 ? "Ou envoie la tienne" : "Envoie une image"
            }
            hint="JPG ou PNG, 5 Mo maximum."
            state={errors.image ? "error" : "default"}
            stateRelatedMessage={errors.image?.message?.toString()}
            nativeInputProps={{
              accept: "image/*",
              ...register("image"),
            }}
          />
        )}
      </fieldset>

      {!isAnimation && (
        <Alert
          className={fr.cx("fr-my-2w")}
          severity="info"
          small
          description="Ta proposition sera examinée par l'équipe animation avant d'apparaître au catalogue."
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
