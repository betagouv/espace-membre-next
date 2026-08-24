"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { updateFormation } from "@/app/api/formations/actions";
import { GristParticipant } from "@/lib/formationsGrist";
import {
  formationUpdateSchema,
  formationUpdateSchemaType,
} from "@/models/actions/formationProposal";
import { AlertMessageType } from "@/models/common";
import {
  FORMATION_AUDIENCES,
  FORMATION_DUREES,
  FORMATION_MODALITE_CHOICES,
  FORMATION_THEMATIQUES,
} from "@/models/formationsGrist";

const emptyAsUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const Detail = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) =>
  value ? (
    <tr>
      <td style={{ padding: "4px 16px 4px 0", color: "#666" }}>{label}</td>
      <td style={{ padding: "4px 0" }}>
        <strong>{value}</strong>
      </td>
    </tr>
  ) : null;

/**
 * Panneau réservé à l'animateur·ice et à l'équipe d'animation : détail complet
 * de la formation, liste des participants, et modification des informations.
 *
 * Le droit est vérifié côté serveur à l'affichage comme à l'enregistrement :
 * cacher le panneau ne suffirait pas.
 */
export const FormationManagePanel = ({
  defaultValues,
  participants,
  statut,
}: {
  defaultValues: formationUpdateSchemaType;
  participants: GristParticipant[];
  statut?: string;
}) => {
  const [editing, setEditing] = React.useState(false);
  const [alertMessage, setAlertMessage] =
    React.useState<AlertMessageType | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<formationUpdateSchemaType>({
    resolver: zodResolver(formationUpdateSchema),
    mode: "onChange",
    defaultValues,
  });

  const onSubmit = async (data: formationUpdateSchemaType) => {
    const res = await updateFormation(data);
    if (res.success) {
      setAlertMessage({
        title: "Formation mise à jour",
        message: "Les modifications sont enregistrées.",
        type: "success",
      });
      setEditing(false);
      router.refresh();
    } else {
      setAlertMessage({
        title: "Une erreur est survenue",
        message: res.message || "",
        type: "warning",
      });
    }
  };

  const inscrits = participants.filter((p) => !p.onWaitingList);
  const enAttente = participants.filter((p) => p.onWaitingList);

  return (
    <div className={fr.cx("fr-mt-4w")}>
      <Accordion label="Gestion de la formation" defaultExpanded>
        {!!alertMessage && (
          <Alert
            className={fr.cx("fr-mb-2w")}
            severity={alertMessage.type}
            title={alertMessage.title}
            description={alertMessage.message}
            small
          />
        )}

        {!editing ? (
          <>
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: 14,
                width: "100%",
              }}
            >
              <tbody>
                <Detail label="Statut" value={statut} />
                <Detail label="Modalité" value={defaultValues.modalite} />
                <Detail label="Durée" value={defaultValues.duree} />
                <Detail
                  label="Capacité"
                  value={defaultValues.capacite?.toString()}
                />
                <Detail
                  label="Catégories"
                  value={defaultValues.thematiques?.join(", ")}
                />
                <Detail
                  label="Audience"
                  value={defaultValues.audience?.join(", ")}
                />
                <Detail label="Animateur·ice" value={defaultValues.animateur} />
                <Detail
                  label="Adresse Tchap"
                  value={defaultValues.animateurTchap}
                />
                <Detail
                  label="Email organisateur·trice"
                  value={defaultValues.emailOrganisateur}
                />
                <Detail
                  label="Lien visio admin"
                  value={defaultValues.lienVisioAdmin}
                />
                <Detail label="Support" value={defaultValues.lienSupport} />
                <Detail label="Feedback" value={defaultValues.lienFeedback} />
                <Detail
                  label="Inscriptions gérées par l'équipe"
                  value={defaultValues.gestionInscriptions ? "Oui" : undefined}
                />
              </tbody>
            </table>

            <p className={fr.cx("fr-mt-3w", "fr-mb-1w")}>
              <strong>
                Participants ({inscrits.length}
                {enAttente.length ? ` + ${enAttente.length} en attente` : ""})
              </strong>
            </p>
            {participants.length === 0 ? (
              <p className={fr.cx("fr-hint-text")}>Personne inscrit·e.</p>
            ) : (
              <ul className={fr.cx("fr-mb-0")}>
                {participants.map((participant, index) => (
                  <li key={`${participant.email}-${index}`}>
                    {participant.name}
                    {participant.email ? ` — ${participant.email}` : ""}{" "}
                    {participant.onWaitingList && (
                      <Badge as="span" small>
                        liste d&apos;attente
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <Button
              className={fr.cx("fr-mt-3w")}
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={() => setEditing(true)}
            >
              Modifier les informations
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Sujet de la formation"
              state={errors.titre ? "error" : "default"}
              stateRelatedMessage={errors.titre?.message}
              nativeInputProps={{ ...register("titre") }}
            />
            <Input
              label="Description"
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
                nativeInputProps: {
                  value: thematique,
                  ...register("thematiques"),
                },
              }))}
            />
            <Checkbox
              legend="Audience cible"
              state={errors.audience ? "error" : "default"}
              stateRelatedMessage={errors.audience?.message}
              options={FORMATION_AUDIENCES.map((audience) => ({
                label: audience,
                nativeInputProps: { value: audience, ...register("audience") },
              }))}
            />
            <div
              className={fr.cx(
                "fr-grid-row",
                "fr-grid-row--gutters",
                "fr-mb-3w",
              )}
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
                  label="Limite de participants"
                  hintText="Appliquée à la session à venir."
                  state={errors.capacite ? "error" : "default"}
                  stateRelatedMessage={errors.capacite?.message}
                  nativeInputProps={{
                    type: "number",
                    min: 1,
                    step: 1,
                    ...register("capacite", {
                      setValueAs: (value) =>
                        value === "" || value === null
                          ? undefined
                          : Number(value),
                    }),
                  }}
                />
              </div>
            </div>
            <Input
              label="Lien de visioconférence administrateur"
              state={errors.lienVisioAdmin ? "error" : "default"}
              stateRelatedMessage={errors.lienVisioAdmin?.message}
              nativeInputProps={{
                type: "url",
                placeholder: "https://",
                ...register("lienVisioAdmin", { setValueAs: emptyAsUndefined }),
              }}
            />
            <Input
              label="Lien du support"
              state={errors.lienSupport ? "error" : "default"}
              stateRelatedMessage={errors.lienSupport?.message}
              nativeInputProps={{
                type: "url",
                placeholder: "https://",
                ...register("lienSupport", { setValueAs: emptyAsUndefined }),
              }}
            />
            <Input
              label="Lien du formulaire de feedback"
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
              label="Adresse Tchap de l'animateur·ice"
              state={errors.animateurTchap ? "error" : "default"}
              stateRelatedMessage={errors.animateurTchap?.message}
              nativeInputProps={{
                type: "email",
                placeholder: "prenom.nom@beta.gouv.fr",
                ...register("animateurTchap", {
                  setValueAs: emptyAsUndefined,
                }),
              }}
            />
            <Input
              label="Email de l'organisateur·trice"
              state={errors.emailOrganisateur ? "error" : "default"}
              stateRelatedMessage={errors.emailOrganisateur?.message}
              nativeInputProps={{
                type: "email",
                ...register("emailOrganisateur"),
              }}
            />
            <Checkbox
              legend="Souhaites-tu que nous gérions les inscriptions ?"
              options={[
                {
                  label: "Oui, je veux bien",
                  nativeInputProps: { ...register("gestionInscriptions") },
                },
              ]}
            />
            <input type="hidden" {...register("formationId")} />

            <Button
              className={fr.cx("fr-mt-2w")}
              nativeButtonProps={{ type: "submit", disabled: isSubmitting }}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              className={fr.cx("fr-mt-2w", "fr-ml-2w")}
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={() => setEditing(false)}
            >
              Annuler
            </Button>
          </form>
        )}
      </Accordion>
    </div>
  );
};
