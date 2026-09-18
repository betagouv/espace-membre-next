"use client";

import { useState } from "react";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import Link from "next/link";

import { safeRevokeApiKey } from "@/app/api/api-keys/actions/revokeApiKey";

export type ApiKeyRow = {
  uuid: string;
  kind: string;
  name: string;
  token_prefix: string;
  scopes: string[];
  read_perimeter: string | null;
  write_perimeter: string | null;
  expires_at: Date | null;
  last_used_at: Date | null;
  revoked_at: Date | null;
  revoked_reason: string | null;
  created_at: Date;
};

const fmt = (date: Date | null) =>
  date ? new Date(date).toLocaleDateString("fr-FR") : "jamais";

const stateOf = (key: ApiKeyRow) => {
  if (key.revoked_at) return { label: "Révoquée", severity: "error" as const };
  if (key.expires_at && new Date(key.expires_at) <= new Date())
    return { label: "Expirée", severity: "warning" as const };
  // Perimetre orphelin : la clef est deja refusee a l'authentification et sera
  // revoquee au prochain balayage. On l'affiche comme telle plutot que de
  // masquer le probleme.
  if (!key.read_perimeter)
    return { label: "Inexploitable", severity: "warning" as const };
  return { label: "Active", severity: "success" as const };
};

export const ApiKeyTable = ({
  apiKeys,
  canManage,
  detailBaseUrl,
}: {
  apiKeys: ApiKeyRow[];
  canManage: boolean;
  detailBaseUrl?: string;
}) => {
  const [pending, setPending] = useState<string | null>(null);

  const revoke = async (key: ApiKeyRow) => {
    const reason = window.prompt(
      `Motif de révocation de « ${key.name} » (obligatoire) :`,
    );
    if (!reason || reason.trim().length < 3) return;
    setPending(key.uuid);
    const res = await safeRevokeApiKey({
      uuid: key.uuid,
      revoked_reason: reason.trim(),
    });
    setPending(null);
    if (!res.success) window.alert(res.message);
    else window.location.reload();
  };

  if (!apiKeys.length) {
    return <p>Aucune clef d&apos;API pour le moment.</p>;
  }

  return (
    <Table
      headers={[
        "Nom",
        "Préfixe",
        "Portées",
        "Périmètres",
        "Dernier usage",
        "État",
        "",
      ]}
      data={apiKeys.map((key) => {
        const state = stateOf(key);
        return [
          detailBaseUrl ? (
            <Link key="name" href={`${detailBaseUrl}/${key.uuid}`}>
              {key.name}
            </Link>
          ) : (
            key.name
          ),
          <code key="prefix">{key.token_prefix}</code>,
          key.scopes.join(", "),
          `lecture ${key.read_perimeter ?? "?"}${
            key.write_perimeter ? ` / écriture ${key.write_perimeter}` : ""
          }`,
          fmt(key.last_used_at),
          <Badge key="state" severity={state.severity} noIcon>
            {state.label}
          </Badge>,
          canManage && !key.revoked_at ? (
            <Button
              key="revoke"
              priority="secondary"
              size="small"
              disabled={pending === key.uuid}
              onClick={() => revoke(key)}
            >
              Révoquer
            </Button>
          ) : (
            ""
          ),
        ];
      })}
    />
  );
};
