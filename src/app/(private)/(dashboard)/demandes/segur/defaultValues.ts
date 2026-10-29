import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/authoptions";
import {
  getUserBasicInfo,
  getUserStartupsActive,
} from "@/lib/kysely/queries/users";
import { segurRequestSchemaType } from "@/models/actions/segurRequest";
import { userStartupToModel } from "@/models/mapper/startupMapper";

// Valeurs pré-remplies des deux formulaires Ségur (accès et salle de réunion) :
// le nom, l'adresse mail et la startup du membre connecté.
export async function getSegurDefaultValues(): Promise<
  Partial<segurRequestSchemaType>
> {
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

  return {
    prenomNom: user?.fullname || "",
    email,
    startupName,
  };
}
