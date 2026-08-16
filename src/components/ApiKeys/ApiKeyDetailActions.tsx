"use client";

import { useState } from "react";
import Button from "@codegouvfr/react-dsfr/Button";

import { safeConfirmApiKey } from "@/app/api/api-keys/actions/confirmApiKey";
import { safeRevokeApiKey } from "@/app/api/api-keys/actions/revokeApiKey";

/**
 * Les deux gestes passent par une server action, donc un POST declenche par un
 * humain : un prechargement de lien par une passerelle de messagerie ne
 * revoque rien.
 */
export const ApiKeyDetailActions = ({
  uuid,
  name,
  highlight,
}: {
  uuid: string;
  name: string;
  highlight: "confirm" | "revoke";
}) => {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const confirm = async () => {
    setPending(true);
    const res = await safeConfirmApiKey({ uuid });
    setPending(false);
    setMessage(
      res.success ? "Merci, cette clef est confirmée." : res.message,
    );
  };

  const revoke = async () => {
    const reason = window.prompt(
      `Motif de révocation de « ${name} » (obligatoire) :`,
    );
    if (!reason || reason.trim().length < 3) return;
    setPending(true);
    const res = await safeRevokeApiKey({ uuid, revoked_reason: reason.trim() });
    setPending(false);
    setMessage(res.success ? "Clef révoquée." : res.message);
    if (res.success) window.location.reload();
  };

  return (
    <div>
      {message && <p>{message}</p>}
      <Button
        priority={highlight === "confirm" ? "primary" : "secondary"}
        disabled={pending}
        onClick={confirm}
      >
        Oui, cette clef sert toujours
      </Button>{" "}
      <Button
        priority={highlight === "revoke" ? "primary" : "secondary"}
        disabled={pending}
        onClick={revoke}
      >
        Révoquer cette clef
      </Button>
    </div>
  );
};
