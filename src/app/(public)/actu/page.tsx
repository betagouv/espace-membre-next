import type { Metadata } from "next";

import { Actu } from "./Actu";
import { fr } from "@codegouvfr/react-dsfr";
import { getLatests } from "@lib/kysely/queries/users";
import { lastDayOfMonth } from "date-fns";
export const metadata: Metadata = {
  title: `Actualités / Espace Membre`,
};
/*
 TODO: 
  - github releases
*/

const getLatestsMembers = async () => {
  const lastMembers = await getLatests();
  return lastMembers.map((m) => ({
    fullname: m.fullname,
    username: m.username,
    role: m.fullname,
    domaine: m.domaine,
    startups: m.startups,
  }));
};

export default async function Page() {
  const lastMembers = await getLatestsMembers();
  return (
    <div className={fr.cx("fr-container", "fr-container--fluid")}>
      <Actu lastMembers={lastMembers} />
    </div>
  );
}
