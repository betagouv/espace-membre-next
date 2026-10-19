import { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiKeyCreateForm } from "@/components/ApiKeys/ApiKeyCreateForm";
import { ApiKeyTable } from "@/components/ApiKeys/ApiKeyTable";
import { toApiKeyRow } from "@/lib/api-keys/listItem";
import { writablePerimeters } from "@/lib/api-keys/writablePerimeters";
import { isIncubatorLead } from "@/lib/authorization/incubator";
import { requireAuthSubject } from "@/lib/authorization/subject";
import { listIncubatorApiKeys } from "@/lib/kysely/queries/apiKeys";
import { getIncubatorByRef } from "@/lib/kysely/queries/incubators";
import { getIncubatorStartups } from "@/lib/kysely/queries/incubators";
import { isApiKeyCreationDisabled } from "@/server/config/apiKeys.config";

export const metadata: Metadata = { title: "Clefs d'API de l'incubateur" };

export default async function Page(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  // La liste est visible de tous les connectes, comme la page incubateur
  // elle-meme. Le controle qui compte est dans les actions.
  const subject = await requireAuthSubject();
  const incubator = await getIncubatorByRef({ uuid: id });
  if (!incubator) notFound();

  const canManage =
    subject.isAdmin || (await isIncubatorLead(subject.uuid, incubator.uuid));
  const apiKeys = (await listIncubatorApiKeys(incubator.uuid)).map(toApiKeyRow);
  const startups = await getIncubatorStartups(incubator.uuid);
  const perimeterOptions = {
    incubators: [{ uuid: incubator.uuid, label: incubator.title }],
    startups: startups.map((startup) => ({
      uuid: startup.uuid,
      label: startup.name || startup.ghid || startup.uuid,
    })),
  };
  // Meme regle que sur la fiche membre : responsable d'incubateur et membre
  // d'une equipe de cet incubateur ne sont pas la meme chose, un responsable
  // hors equipe voit donc la page sans pouvoir ecrire sur son perimetre.
  const writeOptions = canManage
    ? await writablePerimeters(subject, perimeterOptions)
    : { incubators: [], startups: [] };

  return (
    <div>
      <h1>Clefs d&apos;API de {incubator.title}</h1>
      <p>
        Une clef d&apos;application n&apos;a pas de porteur humain : toute
        l&apos;équipe vivante de l&apos;incubateur est prévenue à sa création et
        reçoit ses rappels.
      </p>
      <ApiKeyTable apiKeys={apiKeys} canManage={canManage} />
      {canManage && !isApiKeyCreationDisabled() && (
        <div className="fr-mt-4w">
          <h2>Créer une clef d&apos;application</h2>
          <ApiKeyCreateForm
            kind="service"
            ownerIncubatorId={incubator.uuid}
            incubators={perimeterOptions.incubators}
            startups={perimeterOptions.startups}
            writeIncubators={writeOptions.incubators}
            writeStartups={writeOptions.startups}
            canUseGlobalWrite={subject.isAdmin}
          />
        </div>
      )}
    </div>
  );
}
