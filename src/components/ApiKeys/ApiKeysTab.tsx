"use client";

import { fr } from "@codegouvfr/react-dsfr";

import { ApiKeyCreateForm } from "./ApiKeyCreateForm";
import { ApiKeyRow, ApiKeyTable } from "./ApiKeyTable";
import { PerimeterOption } from "./PerimeterSelect";

/**
 * Onglet des clefs personnelles, visible du porteur et des admins seulement
 * (canViewMemberApiKeys), volontairement pas de canEditMember.
 */
export const ApiKeysTab = ({
  apiKeys,
  ownerUuid,
  incubators,
  startups,
  writeIncubators,
  writeStartups,
  isAdmin,
  creationDisabled,
}: {
  apiKeys: ApiKeyRow[];
  ownerUuid: string;
  incubators: PerimeterOption[];
  startups: PerimeterOption[];
  // Sous-ensemble reellement ecrivable : la lecture est libre, l'ecriture non.
  writeIncubators: PerimeterOption[];
  writeStartups: PerimeterOption[];
  isAdmin: boolean;
  creationDisabled: boolean;
}) => (
  <>
    <p>
      Une clef personnelle agit en ton nom sur l&apos;API. Le jeton n&apos;est
      affiché qu&apos;une seule fois, à la création.
    </p>
    <ApiKeyTable
      apiKeys={apiKeys}
      canManage
      detailBaseUrl="/account/api-keys"
    />
    <div className={fr.cx("fr-mt-4w")}>
      <h3>Créer une clef personnelle</h3>
      {creationDisabled ? (
        <p>La création de clefs d&apos;API est temporairement désactivée.</p>
      ) : (
        <ApiKeyCreateForm
          kind="personal"
          ownerUuid={ownerUuid}
          incubators={incubators}
          startups={startups}
          writeIncubators={writeIncubators}
          writeStartups={writeStartups}
          canUseGlobalWrite={isAdmin}
        />
      )}
    </div>
  </>
);
