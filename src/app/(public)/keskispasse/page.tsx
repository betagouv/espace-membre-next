import type { Metadata } from "next";
import { routeTitles } from "@/utils/routes/routeTitles";
import betagouv from "@/server/betagouv";
import { WhatIsGoingOnWithMember } from "@/components/WhatIsGoingOnWithMemberPage";

export const metadata: Metadata = {
    title: `${routeTitles.keskispasse()} / Espace Membre`,
};

export default async function Page() {
    const usersInfos = await betagouv.usersInfos();
    return <WhatIsGoingOnWithMember users={usersInfos} />;
}
