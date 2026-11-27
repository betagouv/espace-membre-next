import { Metadata } from "next";

import { MemberMergeForm } from "@/components/Admin/MemberMergeForm";
import { requireAdmin } from "@/lib/authorization/subject";
import { getAllMembersLight } from "@/lib/kysely/queries/users";
import { routeTitles } from "@/lib/routes";

export const metadata: Metadata = { title: routeTitles.adminMemberMerge() };

export default async function Page() {
  await requireAdmin();
  const members = await getAllMembersLight();

  return (
    <div>
      <h1>{routeTitles.adminMemberMerge()}</h1>
      <p>
        Une même personne a parfois deux fiches. La fusion déplace tout ce qui
        est rattaché à la fiche absorbée (missions, équipes, compte Tchap,
        adresses DINUM, clefs d&apos;API, historique…) sur la fiche gardée, puis
        supprime la fiche absorbée.
      </p>
      <MemberMergeForm members={members} />
    </div>
  );
}
