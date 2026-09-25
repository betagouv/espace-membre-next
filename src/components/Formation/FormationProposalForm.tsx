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
import { Controller, useForm } from "react-hook-form";

import { submitFormationProposal } from "@/app/api/formations/actions";
import { AlertMessageType } from "@/models/common";
import {
  TYPES_IMAGE_ACCEPTES,
  formationProposalSchema,
  formationProposalSchemaType,
} from "@/models/actions/formationProposal";
import {
  FORMATION_AUDIENCES,
  FORMATION_DUREES,
  FORMATION_MODALITE,
  FORMATION_MODALITE_CHOICES,
  FORMATION_THEMATIQUES,
  libelleAudience,
} from "@/models/formationsGrist";
import { routes } from "@/lib/routes";
import { FormationDateTimeFields } from "@/components/Formation/FormationDateTimeFields";
import { FormationImagePicker } from "@/components/Formation/FormationImagePicker";
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
    control,
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
  // Un e-learning est ouvert en continu : ni date, ni limite de places, ni
  // visioconférence, mais un lien vers la formation elle-même.
  const isELearning = watch("modalite") === FORMATION_MODALITE.E_LEARNING;
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
        message: !isAnimation
          ? "Merci ! L'équipe animation va examiner ta proposition et revenir vers toi."
          : data.modalite === FORMATION_MODALITE.E_LEARNING
            ? "L'e-learning est ajouté au catalogue."
            : "La formation est ajoutée au catalogue. Tu peux programmer ses sessions depuis sa fiche, dans « Gestion de la formation ».",
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
        orientation="horizontal"
        state={errors.modalite ? "error" : "default"}
        stateRelatedMessage={errors.modalite?.message}
        options={FORMATION_MODALITE_CHOICES.map((modalite) => ({
          label: modalite,
          nativeInputProps: { value: modalite, ...register("modalite") },
        }))}
      />

      <Checkbox
        legend="Audience cible"
        hintText="Tu peux en sélectionner plusieurs."
        orientation="horizontal"
        state={errors.audience ? "error" : "default"}
        stateRelatedMessage={errors.audience?.message}
        options={FORMATION_AUDIENCES.map((audience) => ({
          label: libelleAudience(audience),
          nativeInputProps: { value: audience, ...register("audience") },
        }))}
      />

      <Checkbox
        legend="Catégorie"
        orientation="horizontal"
        state={errors.thematiques ? "error" : "default"}
        stateRelatedMessage={errors.thematiques?.message}
        options={FORMATION_THEMATIQUES.map((thematique) => ({
          label: thematique,
          nativeInputProps: { value: thematique, ...register("thematiques") },
        }))}
      />

      <div
        className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-3w")}
        style={{ alignItems: "flex-start" }}
      >
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <Input
            className={fr.cx("fr-mb-0")}
            label="Qui animera cette formation ?"
            state={errors.animateur ? "error" : "default"}
            stateRelatedMessage={errors.animateur?.message}
            nativeInputProps={{ ...register("animateur") }}
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
          <Input
            className={fr.cx("fr-mb-0")}
            label="Email de l'organisateur·trice"
            state={errors.emailOrganisateur ? "error" : "default"}
            stateRelatedMessage={errors.emailOrganisateur?.message}
            nativeInputProps={{
              type: "email",
              ...register("emailOrganisateur"),
            }}
          />
        </div>
      </div>

      {/* alignItems + fr-mb-0 : la marge basse de .fr-input-group varie selon
          le point de rupture, sans quoi les champs se décalent. L'alignement
          par le haut, et non par le bas : un message d'erreur pousse vers le
          bas, et remonterait sinon le champ fautif au-dessus de ses voisins. */}
      <div
        className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-3w")}
        style={{ alignItems: "flex-start" }}
      >
        {/* Les champs masqués en e-learning partent avec leur valeur
            (shouldUnregister) : une date ou une limite saisie avant de changer
            de modalité ne doit ni bloquer l'envoi sans qu'on la voie, ni
            arriver jusqu'au serveur. */}
        {!isELearning && (
          <Controller
            control={control}
            name="dateDebut"
            shouldUnregister
            render={({ field }) => (
              <FormationDateTimeFields
                className={fr.cx("fr-mb-0")}
                dateLabel="Date de la formation"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.dateDebut?.message}
              />
            )}
          />
        )}
        <div
          className={fr.cx(
            "fr-col-12",
            isELearning ? "fr-col-md-6" : "fr-col-md-5",
          )}
        >
          <Select
            className={fr.cx("fr-mb-0")}
            label="Durée"
            // Sans date, « durée » se lirait comme une durée d'ouverture : on
            // précise que c'est le temps qu'il faut pour la suivre. L'aide
            // aligne aussi le champ sur « Lien de la formation », à côté, qui
            // a la sienne.
            hint={
              isELearning ? "Le temps qu'il faut pour la suivre." : undefined
            }
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
        {isELearning && (
          <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
            <Input
              className={fr.cx("fr-mb-0")}
              label="Lien de la formation"
              hintText="L'adresse où suivre l'e-learning."
              state={errors.lienSupport ? "error" : "default"}
              stateRelatedMessage={errors.lienSupport?.message}
              nativeInputProps={{
                type: "url",
                placeholder: "https://",
                ...register("lienSupport", {
                  setValueAs: emptyAsUndefined,
                  shouldUnregister: true,
                }),
              }}
            />
          </div>
        )}
      </div>

      {!isELearning && (
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mb-3w")}
          style={{ alignItems: "flex-start" }}
        >
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
                  shouldUnregister: true,
                }),
              }}
            />
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-md-6")}>
            <Input
              className={fr.cx("fr-mb-0")}
              label="Lien de visioconférence administrateur"
              hintText="Requis pour une formation en distanciel."
              state={errors.lienVisioAdmin ? "error" : "default"}
              stateRelatedMessage={errors.lienVisioAdmin?.message}
              nativeInputProps={{
                type: "url",
                placeholder: "https://",
                ...register("lienVisioAdmin", {
                  setValueAs: emptyAsUndefined,
                  shouldUnregister: true,
                }),
              }}
            />
          </div>
        </div>
      )}

      <div className={fr.cx("fr-input-group")}>
        <p className={fr.cx("fr-label", "fr-mb-1v")}>
          Image ou bannière de la formation
          <span className={fr.cx("fr-hint-text")}>
            Elle illustre la formation au catalogue. Choisis-en une, ou envoie
            la tienne.
          </span>
        </p>

        <FormationImagePicker
          images={images}
          value={imageId}
          onChange={(id) => setValue("imageId", id, { shouldValidate: true })}
        />

        <input type="hidden" {...register("imageId")} />

        {!imageId && (
          <Upload
            className={fr.cx("fr-mt-2w")}
            label={
              images.length > 0 ? "Ou envoie la tienne" : "Envoie une image"
            }
            hint="JPG, PNG, WEBP ou GIF, 5 Mo maximum."
            state={errors.image ? "error" : "default"}
            stateRelatedMessage={errors.image?.message?.toString()}
            nativeInputProps={{
              // Même liste que la validation : le sélecteur de fichiers ne
              // propose pas ce que le schéma refusera.
              accept: TYPES_IMAGE_ACCEPTES.join(","),
              ...register("image"),
            }}
          />
        )}
      </div>

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
