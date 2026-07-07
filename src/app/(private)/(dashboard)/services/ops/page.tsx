import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { OpsRequestForm } from "@/components/Service/OpsRequestForm";
import { StartupType } from "@/components/SESelect";
import { getAllStartups } from "@/lib/kysely/queries";
import {
  getMatrixIdByUserId,
  getUserBasicInfo,
  getUserStartupsActive,
} from "@/lib/kysely/queries/users";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { authOptions } from "@/utils/authoptions";

export default async function OpsRequestPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = await getUserBasicInfo({ uuid: session.user.uuid });
  const matrixId = await getMatrixIdByUserId(session.user.uuid);
  const email = user?.primary_email || user?.secondary_email || "";

  // Startups the user can act on (admins see all) — used by the Sentry / Matomo
  // demandes to pick the concerned product.
  const startups = session.user.isAdmin
    ? await getAllStartups()
    : (await getUserStartupsActive(session.user.uuid)).map((startup) =>
        userStartupToModel(startup),
      );
  const startupOptions: StartupType[] = startups.map((startup) => ({
    value: startup.uuid,
    label: startup.name,
  }));

  return (
    <div>
      <h1>Demandes d'OPS</h1>
      <OpsRequestForm
        startupOptions={startupOptions}
        defaultValues={{
          tchapId: matrixId || user?.username || "",
          email,
          prenomNom: user?.fullname || "",
          // pré-rempli pour les demandes qui réclament un email
          emailCollaborateur: email,
          emailAssocier: email,
          emailsNotifier: email,
        }}
      />
    </div>
  );
}
