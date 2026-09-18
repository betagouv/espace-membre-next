import { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiKeyDetailActions } from "@/components/ApiKeys/ApiKeyDetailActions";
import { isUuid } from "@/lib/api/identifier";
import { toApiKeyRow } from "@/lib/api-keys/listItem";
import { isIncubatorLead } from "@/lib/authorization/incubator";
import { requireAuthSubject } from "@/lib/authorization/subject";
import { getApiKeyForOwner } from "@/lib/kysely/queries/apiKeys";

export const metadata: Metadata = { title: "Clef d'API" };

/**
 * Cible des deux liens du courriel de rappel. Le GET ne mute RIEN : les
 * passerelles de messagerie dereferencent les liens pour analyse et
 * declencheraient la revocation avant lecture. ?action= ne sert qu'a mettre en
 * avant un bouton.
 */
export default async function Page(props: {
  params: Promise<{ uuid: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { uuid } = await props.params;
  const { action } = await props.searchParams;
  const subject = await requireAuthSubject();

  // La colonne est de type uuid : comparer une chaine libre fait lever Postgres
  // en 22P02 avant meme de rendre une ligne vide, donc 500 au lieu de 404.
  if (!isUuid(uuid)) notFound();

  const key = await getApiKeyForOwner(uuid);
  if (!key) notFound();

  // L'autorisation couvre les deux natures : une clef d'application a
  // owner_user_id a NULL et son rappel part a toute l'equipe de l'incubateur.
  const allowed =
    subject.isAdmin ||
    (key.kind === "personal" && key.owner_user_id === subject.uuid) ||
    (key.kind === "service" &&
      !!key.owner_incubator_id &&
      (await isIncubatorLead(subject.uuid, key.owner_incubator_id)));
  // 404 et non 403 : ne pas reveler l'existence d'une clef d'autrui.
  if (!allowed) notFound();

  const row = toApiKeyRow(key);
  const fmt = (date: Date | null) =>
    date ? new Date(date).toLocaleDateString("fr-FR") : "jamais";

  return (
    <div>
      <h1>{row.name}</h1>
      <ul>
        <li>Préfixe : <code>{row.token_prefix}</code></li>
        <li>
          Nature :{" "}
          {row.kind === "personal" ? "clef personnelle" : "clef d'application"}
        </li>
        <li>Portées : {row.scopes.join(", ")}</li>
        <li>Périmètre de lecture : {row.read_perimeter ?? "cible supprimée"}</li>
        <li>
          Périmètre d&apos;écriture : {row.write_perimeter ?? "aucun"}
        </li>
        <li>Créée le {fmt(row.created_at)}</li>
        <li>Dernière utilisation : {fmt(row.last_used_at)}</li>
        {/* Les deux paliers de rappel se comptent depuis la confirmation
            lorsqu'il y en a eu une : la date est donc lisible ici. */}
        <li>Dernière confirmation : {fmt(key.confirmed_at)}</li>
        <li>Dernier rappel envoyé : {fmt(key.reminder_last_sent_at)}</li>
        <li>
          État :{" "}
          {row.revoked_at
            ? `révoquée le ${fmt(row.revoked_at)} (${row.revoked_reason})`
            : "active"}
        </li>
      </ul>
      {!row.revoked_at && (
        <ApiKeyDetailActions
          uuid={row.uuid}
          name={row.name}
          highlight={action === "revoke" ? "revoke" : "confirm"}
        />
      )}
    </div>
  );
}
