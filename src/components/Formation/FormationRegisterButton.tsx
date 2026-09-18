"use client";

import React from "react";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";

import {
  registerToFormationSession,
  unregisterFromFormationSession,
} from "@/app/api/formations/actions";

type State = "idle" | "inscrit" | "attente";

/**
 * Inscription à une session de formation.
 *
 * L'état de départ vient du serveur ; il n'évolue ici qu'après confirmation de
 * l'enregistrement, pour ne pas annoncer une inscription qui a échoué.
 */
export const FormationRegisterButton = ({
  sessionId,
  isRegistered,
  isOnWaitingList,
  seatsLeft,
  isAnimator = false,
}: {
  sessionId?: string;
  isRegistered: boolean;
  isOnWaitingList: boolean;
  seatsLeft: number;
  isAnimator?: boolean;
}) => {
  const [state, setState] = React.useState<State>(
    isRegistered ? (isOnWaitingList ? "attente" : "inscrit") : "idle",
  );
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  // On n'assiste pas à sa propre formation : proposer l'inscription n'aurait
  // pas de sens, et prendrait une place aux participants.
  if (isAnimator) {
    return (
      <Badge severity="info" as="span">
        Tu animes cette formation
      </Badge>
    );
  }

  if (!sessionId) {
    return (
      <Badge as="span" severity="info">
        Aucune date programmée
      </Badge>
    );
  }

  const onUnregister = async () => {
    setPending(true);
    setError(null);
    const res = await unregisterFromFormationSession(sessionId);
    setPending(false);
    if (!res.success) {
      setError(res.message || "La désinscription n'a pas abouti.");
      return;
    }
    setState("idle");
    // Le compteur de places et la liste d'attente sont recalculés côté serveur.
    router.refresh();
  };

  if (state === "inscrit" || state === "attente") {
    return (
      <>
        {state === "inscrit" ? (
          <Badge severity="success" as="span">
            Inscrit
          </Badge>
        ) : (
          <Badge as="span">Inscrit sur liste d&apos;attente</Badge>
        )}
        <Button
          className="fr-mt-2v"
          priority="secondary"
          size="small"
          nativeButtonProps={{ type: "button", disabled: pending }}
          onClick={onUnregister}
        >
          {pending ? "Désinscription en cours..." : "Me désinscrire"}
        </Button>
        {!!error && (
          <Alert
            className="fr-mt-2v"
            severity="warning"
            small
            description={error}
          />
        )}
      </>
    );
  }

  const onClick = async () => {
    setPending(true);
    setError(null);
    const res = await registerToFormationSession(sessionId);
    setPending(false);
    if (!res.success) {
      setError(res.message || "L'inscription n'a pas abouti.");
      return;
    }
    setState(res.data?.onWaitingList ? "attente" : "inscrit");
    // Rafraîchit le compteur de places, calculé côté serveur.
    router.refresh();
  };

  return (
    <>
      <Button
        nativeButtonProps={{ type: "button", disabled: pending }}
        onClick={onClick}
      >
        {pending
          ? "Inscription en cours..."
          : seatsLeft <= 0
            ? "M'inscrire sur liste d'attente"
            : "M'inscrire"}
      </Button>
      {!!error && (
        <Alert
          className="fr-mt-2v"
          severity="warning"
          small
          description={error}
        />
      )}
    </>
  );
};
