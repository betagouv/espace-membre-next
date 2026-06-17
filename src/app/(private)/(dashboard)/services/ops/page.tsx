import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { OpsRequestForm } from "@/components/Service/OpsRequestForm";
import {
  getMatrixIdByUserId,
  getUserBasicInfo,
} from "@/lib/kysely/queries/users";
import { authOptions } from "@/utils/authoptions";

export default async function OpsRequestPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = await getUserBasicInfo({ uuid: session.user.uuid });
  const matrixId = await getMatrixIdByUserId(session.user.uuid);
  const email = user?.secondary_email || user?.primary_email || "";

  return (
    <div>
      <h1>Demandes d'OPS</h1>
      <OpsRequestForm
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
