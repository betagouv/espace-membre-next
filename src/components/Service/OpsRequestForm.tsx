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
  OPS_DEMANDE_LABELS,
  OPS_DEMANDE_TYPE,
  OPS_FIELDS,
} from "@/models/ops";
import Link from "next/link";

// Doc de l'embarquement dev : prérequis obligatoire avant toute commande de
// ressources.
const EMBARQUEMENT_DEV_DOC_URL = "https://airtable.com/shrUCbUT72KtKefsu";

// Canal Tchap où l'équipe ops traite les demandes : lien de suivi donné à la
// soumission du formulaire.
const OPS_TCHAP_CHANNEL_URL =
  "https://tchap.gouv.fr/#/room/!VxFWdbcSlumKPvpVRP:agent.dinum.tchap.gouv.fr";

// Chaque champ passe par ce conteneur : il porte à la fois la largeur et
// l'espacement. Laissés aux marges par défaut de chaque composant DSFR, les
// écarts variaient d'un champ à l'autre selon la ressource choisie.
//
// Les champs texte s'arrêtent à la moitié de la largeur : à pleine largeur,
// l'œil balaye tout l'écran pour saisir quelques mots. Les boutons radio et
// les commentaires gardent la pleine largeur, leur contenu la remplit.
const Champ = ({
  children,
  pleineLargeur = false,
}: {
  children: React.ReactNode;
  pleineLargeur?: boolean;
}) => (
  <div className={fr.cx("fr-grid-row", "fr-mb-4w")}>
    <div
      className={fr.cx(
        "fr-col-12",
        ...(pleineLargeur ? [] : (["fr-col-md-6"] as const)),
      )}
    >
      {children}
    </div>
  </div>
);

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
      {/* Les deux conditions d'accès en liste : en paragraphe, elles se lisaient
          comme un avertissement à survoler, et le lien d'inscription — la seule
          action possible quand on ne les remplit pas — s'y perdait. */}
      <Alert
        className="fr-mb-4v"
        severity="warning"
        closable={false}
        title="Les ressources OPS sont réservées :"
        description={
          <ul className={fr.cx("fr-mb-0")}>
            <li>aux services numériques ayant une fiche produit</li>
            <li>
              aux personnes ayant suivi un{" "}
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
                embarquement dev
              </a>
            </li>
          </ul>
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

        {/* Le projet vaut pour toutes les demandes : il ouvre le formulaire au
            lieu de le clore, où il se lisait comme une question annexe. */}
        <Champ>
          <Input
            className={fr.cx("fr-mb-0")}
            label="Projet concerné"
            hintText="Pré-rempli avec ton produit. Remplace-le si la demande concerne autre chose."
            state={errors.projet ? "error" : undefined}
            stateRelatedMessage={errors.projet?.message}
            nativeInputProps={{ ...register("projet") }}
          />
        </Champ>

        <Champ pleineLargeur>
          <RadioButtons
            className={fr.cx("fr-mb-0")}
            legend="Ressource demandée"
            state={errors.demande ? "error" : undefined}
            stateRelatedMessage={errors.demande?.message}
            options={OPS_DEMANDE_CHOICES.map((choice) => ({
              label: OPS_DEMANDE_LABELS[choice],
              nativeInputProps: {
                value: choice,
                ...register("demande"),
              },
            }))}
          />
        </Champ>

        {demande === OPS_DEMANDE_TYPE.SCALINGO_APP && (
          <Alert
            className="fr-mb-4v"
            severity="error"
            small
            description={
              <div>
                Si votre incubateur dispose de son propre Scalingo (par ex : la
                Fabrique de l'Écologie), contactez directement{" "}
                <Link href="https://doc.incubateur.net/communaute/gerer-son-produit/gestion-au-quotidien/tech/to-do-liens-avec-les-referents-techs">
                  votre référent.e tech
                </Link>
                .
              </div>
            }
          />
        )}

        {/* Les champs surgissent au choix de la ressource : un titre annonce
            qu'une nouvelle section apparaît, au lieu de les laisser pousser
            sans prévenir sous les boutons radio. */}
        {fields.length > 0 && (
          <h2 className={fr.cx("fr-h4", "fr-mt-4w", "fr-mb-2w")}>
            Informations complémentaires
          </h2>
        )}

        {fields.map((key) => {
          const field = OPS_FIELDS[key];
          const error = errors[key];
          if (field.type === "startup") {
            return (
              <Champ key={key}>
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
              </Champ>
            );
          }
          if (field.type === "select") {
            return (
              <Champ key={key} pleineLargeur>
                <RadioButtons
                  className={fr.cx("fr-mb-0")}
                  legend={field.label}
                  hintText={field.hint}
                  state={error ? "error" : undefined}
                  stateRelatedMessage={error?.message}
                  options={(field.options ?? []).map((option) => ({
                    label: option.label ?? option.value,
                    hintText: option.hint,
                    nativeInputProps: {
                      value: option.value,
                      defaultChecked: option.value === field.defaultValue,
                      ...register(key),
                    },
                  }))}
                />
              </Champ>
            );
          }
          if (field.type === "textarea") {
            return (
              <Champ key={key} pleineLargeur>
                <Input
                  className={fr.cx("fr-mb-0")}
                  label={field.label}
                  hintText={field.hint}
                  textArea
                  state={error ? "error" : undefined}
                  stateRelatedMessage={error?.message}
                  nativeTextAreaProps={{ ...register(key) }}
                />
              </Champ>
            );
          }
          return (
            <Champ key={key}>
              <Input
                className={fr.cx("fr-mb-0")}
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
                  className={fr.cx("fr-mt-1v")}
                  severity="warning"
                  small
                  description={field.warnOnInput}
                />
              )}
            </Champ>
          );
        })}

        <input type="hidden" {...register("prenomNom")} />

        <Button
          className={fr.cx("fr-mt-3w")}
          disabled={isSaving}
          nativeButtonProps={{ type: "submit", disabled: isSubmitting }}
        >
          {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
        </Button>
      </form>
    </>
  );
};
