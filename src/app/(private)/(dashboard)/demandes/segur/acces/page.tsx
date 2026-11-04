import { Metadata } from "next";

import { getSegurDefaultValues } from "../defaultValues";
import { SegurRequestForm } from "@/components/Service/SegurRequestForm";
import { routeTitles } from "@/lib/routes";
import { SEGUR_DEMANDE_TYPE } from "@/models/segur";

export const metadata: Metadata = {
  title: `${routeTitles.segurAccessRequest()} / Espace Membre`,
};

export default async function SegurAccessRequestPage() {
  const defaultValues = await getSegurDefaultValues();

  return (
    <div>
      <h1>{routeTitles.segurAccessRequest()}</h1>
      <SegurRequestForm
        typeDemande={SEGUR_DEMANDE_TYPE.ACCES}
        defaultValues={defaultValues}
      />
    </div>
  );
}
