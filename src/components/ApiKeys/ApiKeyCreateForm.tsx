"use client";

import { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";

import { safeCreatePersonalApiKey } from "@/app/api/api-keys/actions/createPersonalApiKey";
import { safeCreateServiceApiKey } from "@/app/api/api-keys/actions/createServiceApiKey";
import { ApiPerimeter } from "@/models/api/perimeter";
import { ApiScope } from "@/models/api/scope";

import { ApiKeyReveal } from "./ApiKeyReveal";
import { PerimeterOption, PerimeterSelect } from "./PerimeterSelect";
import { ScopeCheckboxes } from "./ScopeCheckboxes";

export const ApiKeyCreateForm = ({
  kind,
  ownerUuid,
  ownerIncubatorId,
  incubators,
  startups,
  writeIncubators,
  writeStartups,
  canUseGlobalWrite,
}: {
  kind: "personal" | "service";
  ownerUuid?: string;
  ownerIncubatorId?: string | null;
  incubators: PerimeterOption[];
  startups: PerimeterOption[];
  // Calcules par le serveur avec canUseWritePerimeter, la fonction meme dont
  // depend le submit : ce qui est propose ici est donc toujours acceptable.
  writeIncubators: PerimeterOption[];
  writeStartups: PerimeterOption[];
  canUseGlobalWrite: boolean;
}) => {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiScope[]>([]);
  const [read, setRead] = useState<ApiPerimeter>({ kind: "global" });
  const [write, setWrite] = useState<ApiPerimeter | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Un admin garde l'ecriture globale meme sans aucun perimetre nomme.
  // Un perimetre incubateur ouvre AUSSI l'ecriture de ses produits, d'ou
  // l'asymetrie : l'inverse est faux, un perimetre produit n'ouvre jamais
  // l'ecriture d'un incubateur.
  const allowIncubatorWrite = canUseGlobalWrite || !!writeIncubators.length;
  const allowStartupWrite = allowIncubatorWrite || !!writeStartups.length;
  const canWrite = allowStartupWrite;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const input = {
      name,
      kind,
      scopes,
      read_perimeter: read,
      write_perimeter: write,
      expires_at: expiresAt ? new Date(expiresAt) : null,
      owner_incubator_id: kind === "service" ? (ownerIncubatorId ?? null) : null,
    };
    const res =
      kind === "personal"
        ? await safeCreatePersonalApiKey(input, ownerUuid!)
        : await safeCreateServiceApiKey(input);
    setPending(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    // Le jeton ne vit que dans cet etat local : un rechargement le perd.
    setToken(res.data.token);
  };

  if (token) {
    return <ApiKeyReveal token={token} onDismiss={() => setToken(null)} />;
  }

  return (
    <form onSubmit={submit}>
      {error && <Alert severity="error" small description={error} />}
      <Input
        label="Nom de la clef"
        hintText="Ce qui permettra de la reconnaître dans six mois."
        nativeInputProps={{
          value: name,
          onChange: (e) => setName(e.target.value),
          required: true,
          minLength: 3,
        }}
      />
      <ScopeCheckboxes
        value={scopes}
        onChange={setScopes}
        allowStartupWrite={allowStartupWrite}
        allowIncubatorWrite={allowIncubatorWrite}
      />
      <PerimeterSelect
        label="Périmètre de lecture"
        hint="Une lecture globale est ouverte à tout membre."
        value={read}
        incubators={incubators}
        startups={startups}
        allowGlobal
        onChange={(p) => setRead(p ?? { kind: "global" })}
      />
      {canWrite ? (
        <PerimeterSelect
          label="Périmètre d'écriture"
          hint="Obligatoire dès qu'une portée d'écriture est cochée. L'écriture globale est réservée aux administrateurs."
          value={write}
          incubators={writeIncubators}
          startups={writeStartups}
          allowNone
          allowGlobal={canUseGlobalWrite}
          onChange={setWrite}
        />
      ) : (
        // Sans aucun perimetre ecrivable, proposer les portees d'ecriture
        // menerait a un refus au submit : le schema exige un perimetre des
        // qu'une portee `:write` est cochee.
        <p className={fr.cx("fr-hint-text")}>
          Tu ne peux créer qu&apos;une clef de lecture : aucun périmètre
          d&apos;écriture ne t&apos;est ouvert.
        </p>
      )}
      <Input
        label="Expiration (facultative)"
        nativeInputProps={{
          type: "date",
          value: expiresAt,
          onChange: (e) => setExpiresAt(e.target.value),
        }}
      />
      <Button type="submit" disabled={pending}>
        Créer la clef
      </Button>
    </form>
  );
};
