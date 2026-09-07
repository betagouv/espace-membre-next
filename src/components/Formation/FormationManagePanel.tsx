"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatInTimeZone } from "date-fns-tz";
import { fr as frLocale } from "date-fns/locale/fr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  updateFormation,
  validateFormation,
} from "@/app/api/formations/actions";
import { FormationScheduleForm } from "@/components/Formation/FormationScheduleForm";
import {
  FormationSessionsParticipants,
  ParticipantAvecFiche,
} from "@/components/Formation/FormationSessionsParticipants";
import {
  formationUpdateSchema,
  formationUpdateSchemaType,
} from "@/models/actions/formationProposal";
import { AlertMessageType } from "@/models/common";
import {
  FORMATION_AUDIENCES,
  FORMATION_DUREES,
  FORMATION_MODALITE_CHOICES,
  FORMATION_STATUT,
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
    <>
      <dt style={{ color: "var(--text-mention-grey)" }}>{label}</dt>
      <dd style={{ margin: 0 }}>
        <strong>{value}</strong>
      </dd>
    </>
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
  participantsBySession,
  statut,
  canValidate = false,
  sessions = [],
}: {
  defaultValues: formationUpdateSchemaType;
  // `profileUrl` est calculé côté serveur : seules les personnes présentes dans
  // l'annuaire ont une fiche vers laquelle pointer.
  participantsBySession: Record<string, ParticipantAvecFiche[]>;
  statut?: string;
  // Dates à venir : une formation peut être programmée plusieurs fois.
  sessions?: {
    id: string;
    start?: Date;
    maxSeats?: number;
    availableSeats?: number;
  }[];
  // Valider ne revient pas à gérer : seule l'équipe d'animation le peut, pas la
  // personne qui a déposé la proposition.
  canValidate?: boolean;
}) => {
  const [editing, setEditing] = React.useState(false);
  const [scheduling, setScheduling] = React.useState(false);
  // Vrai juste après une programmation : le formulaire s'est fermé, le
  // message prend sa place. Rouvrir le formulaire l'efface.
  const [dateProgrammee, setDateProgrammee] = React.useState(false);
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

  const [validating, setValidating] = React.useState(false);
  const onValidate = async () => {
    setValidating(true);
    const res = await validateFormation(defaultValues.formationId);
    setValidating(false);
    if (res.success) {
      setAlertMessage({
        title: "Formation validée",
        message: "Elle est maintenant au catalogue.",
        type: "success",
      });
      router.refresh();
    } else {
      setAlertMessage({
        title: "Une erreur est survenue",
        message: res.message || "",
        type: "warning",
      });
    }
  };

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

        {statut === FORMATION_STATUT.PROPOSEE && (
          <Alert
            className={fr.cx("fr-mb-2w")}
            severity="info"
            small
            title="Proposition en attente de validation"
            description={
              canValidate ? (
                <>
                  <p className={fr.cx("fr-mb-1w")}>
                    Cette formation n&apos;est pas au catalogue tant
                    qu&apos;elle n&apos;est pas validée.
                  </p>
                  <Button
                    nativeButtonProps={{ type: "button", disabled: validating }}
                    onClick={onValidate}
                  >
                    {validating
                      ? "Validation en cours..."
                      : "Valider cette formation"}
                  </Button>
                </>
              ) : (
                "Elle sera visible au catalogue une fois validée par l'équipe animation."
              )
            }
          />
        )}

        {!editing ? (
          <>
            {/* Des paires libellé / valeur : une liste de définitions, pas un
                tableau sans en-têtes. La grille se cale sur le libellé le plus
                long, la valeur vient se coller à lui au lieu de partir à
                l'autre bout du panneau. */}
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "max-content 1fr",
                columnGap: "1.5rem",
                rowGap: "0.25rem",
                fontSize: 14,
                margin: 0,
              }}
            >
              <Detail label="Statut" value={statut} />
              <Detail label="Modalité" value={defaultValues.modalite} />
              <Detail label="Durée" value={defaultValues.duree} />
              <Detail
                label="Capacité"
                // La ligne reste même sans limite : la voir disparaître se lit
                // comme une donnée manquante, alors que l'absence de limite est
                // un choix, et le seul qui ouvre les inscriptions à tout le monde.
                value={defaultValues.capacite?.toString() ?? "Pas de limite"}
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
                label="Email organisateur·trice"
                value={defaultValues.emailOrganisateur}
              />
              <Detail
                label="Lien visio admin"
                value={defaultValues.lienVisioAdmin}
              />
              <Detail label="Support" value={defaultValues.lienSupport} />
              <Detail label="Feedback" value={defaultValues.lienFeedback} />
            </dl>

            {/* Retour de relecture : chaque action au niveau de ce qu'elle
                touche. Celle-ci modifie les informations ci-dessus. */}
            <Button
              className={fr.cx("fr-mt-2w")}
              size="small"
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={() => setEditing(true)}
            >
              Modifier les informations
            </Button>

            {/* h4 : l'accordéon porte un h3. Le titre suffit à séparer les deux
                blocs du panneau, chacun avec son action en bas — un filet ici
                doublerait celui que l'accordéon trace déjà sous lui. */}
            <h4 className={fr.cx("fr-h6", "fr-mt-4w", "fr-mb-1w")}>
              Sessions programmées ({sessions.length})
            </h4>
            <FormationSessionsParticipants
              sessions={sessions}
              participantsBySession={participantsBySession}
            />

            <Button
              className={fr.cx("fr-mt-2w")}
              size="small"
              priority="secondary"
              nativeButtonProps={{ type: "button" }}
              onClick={() => {
                setDateProgrammee(false);
                setScheduling((was) => !was);
              }}
            >
              {scheduling ? "Annuler" : "Programmer une autre session"}
            </Button>

            {!scheduling && dateProgrammee && (
              <Alert
                className={fr.cx("fr-mt-2w")}
                severity="success"
                small
                title="Session programmée"
                description="Elle est ouverte aux inscriptions et figure dans la liste ci-dessus."
              />
            )}

            {scheduling && (
              <div className={fr.cx("fr-mt-2w")}>
                <FormationScheduleForm
                  formationId={defaultValues.formationId}
                  defaultDuree={defaultValues.duree}
                  defaultCapacite={defaultValues.capacite}
                  defaultLienVisioAdmin={defaultValues.lienVisioAdmin}
                  onSuccess={() => {
                    setScheduling(false);
                    setDateProgrammee(true);
                  }}
                />
              </div>
            )}
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
              orientation="horizontal"
              state={errors.audience ? "error" : "default"}
              stateRelatedMessage={errors.audience?.message}
              options={FORMATION_AUDIENCES.map((audience) => ({
                label: audience,
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
                nativeInputProps: {
                  value: thematique,
                  ...register("thematiques"),
                },
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
                <div
                  className={fr.cx(
                    "fr-grid-row",
                    "fr-grid-row--gutters",
                    "fr-mb-3w",
                  )}
                  style={{ alignItems: "flex-end" }}
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
                  label="Limite de participants par défaut (facultatif)"
                  hintText="Proposée pour les prochaines sessions. Chaque session programmée garde la sienne, modifiable dans sa propre fiche."
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
            {/* Support et retour d'expérience sont retirés du formulaire pour
                l'instant. Les valeurs restent enregistrées : sans ces champs
                cachés, la moindre modification les effacerait. */}
            <input type="hidden" {...register("lienSupport")} />
            <input type="hidden" {...register("lienFeedback")} />
            <input type="hidden" {...register("formationId")} />

            <ButtonsGroup
              className={fr.cx("fr-mt-2w")}
              inlineLayoutWhen="sm and up"
              buttonsSize="small"
              buttons={[
                {
                  children: isSubmitting ? "Enregistrement..." : "Enregistrer",
                  type: "submit",
                  disabled: isSubmitting,
                },
                {
                  children: "Annuler",
                  priority: "secondary",
                  type: "button",
                  onClick: () => setEditing(false),
                },
              ]}
            />
          </form>
        )}
      </Accordion>
    </div>
  );
};
