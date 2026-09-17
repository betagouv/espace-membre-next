import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { SegurRequestForm } from "@/components/Service/SegurRequestForm";
import {
  getUserBasicInfo,
  getUserStartupsActive,
} from "@/lib/kysely/queries/users";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { authOptions } from "@/lib/authoptions";

export default async function SegurAccessRequestPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = await getUserBasicInfo({ uuid: session.user.uuid });
  const email = user?.primary_email || user?.secondary_email || "";

  // Pré-remplit le nom de la startup avec le premier produit actif du membre.
  const startups = (await getUserStartupsActive(session.user.uuid)).map(
    (startup) => userStartupToModel(startup),
  );
  const startupName = startups[0]?.name || "";

  return (
    <div>
      <h1>Demandes Ségur</h1>
      <SegurRequestForm
        defaultValues={{
          prenomNom: user?.fullname || "",
          email,
          startupName,
        }}
      />
    </div>
  );
}
