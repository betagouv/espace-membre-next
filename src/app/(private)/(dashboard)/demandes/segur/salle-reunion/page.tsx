import { Metadata } from "next";

import { getSegurDefaultValues } from "../defaultValues";
import { SegurRequestForm } from "@/components/Service/SegurRequestForm";
import { routeTitles } from "@/lib/routes";
import { SEGUR_DEMANDE_TYPE } from "@/models/segur";

export const metadata: Metadata = {
  title: `${routeTitles.segurMeetingRoomRequest()} / Espace Membre`,
};

export default async function SegurMeetingRoomRequestPage() {
  const defaultValues = await getSegurDefaultValues();

  return (
    <div>
      <h1>{routeTitles.segurMeetingRoomRequest()}</h1>
      <SegurRequestForm
        typeDemande={SEGUR_DEMANDE_TYPE.SALLE_REUNION}
        defaultValues={defaultValues}
      />
    </div>
  );
}
