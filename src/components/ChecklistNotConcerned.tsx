import React, { useEffect, useState } from "react";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";

import {
  NOT_CONCERNED_COMMENT_MAX_LENGTH,
  notConcernedSchemaType,
} from "@/models/checklist";

export type NotConcernedValue = { reason: string; comment: string | null };
export type NotConcernedByField = Record<string, NotConcernedValue>;

type ActionResult = { success: boolean; message?: string };

const NETWORK_ERROR =
  "L'enregistrement a échoué. Recharge la page et réessaie.";

/**
 * Appelle l'action serveur sans jamais rejeter : une erreur réseau (ou une
 * action introuvable après un déploiement) laisserait sinon le bloc bloqué en
 * attente, boutons désactivés.
 */
async function run(action: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await action();
  } catch (e) {
    console.error(e);
    return { success: false, message: NETWORK_ERROR };
  }
}

/**
 * Case « non concerné » d'un item de checklist : une fois cochée, le membre
 * choisit un motif (et ajoute un commentaire, obligatoire pour certains
 * motifs). Rien n'est enregistré avant le bouton : sans motif, la case seule
 * ne veut rien dire.
 */
export function ChecklistNotConcerned({
  config,
  saved,
  done,
  readOnly,
  onSave,
  onClear,
}: {
  config: notConcernedSchemaType;
  // Déclaration enregistrée en base, s'il y en a une.
  saved?: NotConcernedValue;
  // L'item est coché comme fait : il ne peut pas être aussi « non concerné ».
  done: boolean;
  readOnly: boolean;
  onSave: (reason: string, comment: string) => Promise<ActionResult>;
  onClear: () => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(!!saved);
  const [reason, setReason] = useState(saved?.reason ?? "");
  const [comment, setComment] = useState(saved?.comment ?? "");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Cocher l'item comme fait efface le « non concerné » côté serveur : on
  // referme le bloc pour que l'écran dise la même chose.
  useEffect(() => {
    if (done) {
      setOpen(false);
      setReason("");
      setComment("");
      setStatus(null);
    }
  }, [done]);

  const selectedReason = config.reasons.find((r) => r.id === reason);
  const commentRequired = !!selectedReason?.commentRequired;
  const isDirty =
    reason !== (saved?.reason ?? "") ||
    comment.trim() !== (saved?.comment ?? "");

  const onToggle = async (checked: boolean) => {
    setStatus(null);
    if (checked || !saved) {
      setOpen(checked);
      return;
    }
    // Décocher une déclaration enregistrée la supprime : l'item redevient à
    // faire.
    setPending(true);
    const res = await run(onClear);
    setPending(false);
    if (res.success) {
      setOpen(false);
      setReason("");
      setComment("");
    } else {
      setStatus({ type: "error", message: res.message ?? "" });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setStatus({ type: "error", message: "Choisis un motif." });
      return;
    }
    if (commentRequired && !comment.trim()) {
      setStatus({
        type: "error",
        message: "Précise le motif dans le commentaire.",
      });
      return;
    }
    setPending(true);
    const res = await run(() => onSave(reason, comment));
    setPending(false);
    setStatus(
      res.success
        ? { type: "success", message: "Enregistré." }
        : { type: "error", message: res.message ?? "" },
    );
  };

  const savedReasonLabel = saved
    ? (config.reasons.find((r) => r.id === saved.reason)?.label ?? saved.reason)
    : undefined;

  return (
    <div className={fr.cx("fr-ml-4w", "fr-mb-3w")}>
      <Checkbox
        small
        options={[
          {
            label: config.label,
            hintText:
              readOnly && saved
                ? `Motif : ${savedReasonLabel}${
                    saved.comment ? ` – ${saved.comment}` : ""
                  }`
                : undefined,
            nativeInputProps: {
              checked: open,
              disabled: readOnly || pending,
              onChange: (e) => onToggle(e.target.checked),
            },
          },
        ]}
        state={!open && status?.type === "error" ? "error" : "default"}
        stateRelatedMessage={
          !open && status?.type === "error" ? status.message : undefined
        }
      />
      {open && !readOnly && (
        <form onSubmit={onSubmit}>
          <Select
            label="Motif"
            nativeSelectProps={{
              value: reason,
              required: true,
              onChange: (e) => {
                setReason(e.target.value);
                setStatus(null);
              },
            }}
          >
            <option value="" disabled>
              Sélectionner un motif
            </option>
            {config.reasons.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
          <Input
            label="Commentaire"
            hintText={
              commentRequired ? "Obligatoire pour ce motif." : "Facultatif."
            }
            textArea
            nativeTextAreaProps={{
              value: comment,
              rows: 2,
              maxLength: NOT_CONCERNED_COMMENT_MAX_LENGTH,
              required: commentRequired,
              onChange: (e) => {
                setComment(e.target.value);
                setStatus(null);
              },
            }}
            state={status ? status.type : "default"}
            stateRelatedMessage={status?.message}
          />
          <Button
            type="submit"
            size="small"
            priority="secondary"
            disabled={pending || (!!saved && !isDirty)}
          >
            Enregistrer
          </Button>
        </form>
      )}
    </div>
  );
}
