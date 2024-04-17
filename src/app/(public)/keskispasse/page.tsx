import type { Metadata } from "next";

import { WhatIsGoingOnWithMember } from "@/components/WhatIsGoingOnWithMemberPage";
import betagouv from "@/server/betagouv";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.keskispasse()} / Espace Membre`,
};

export default async function Page() {
    const usersInfos = await betagouv.usersInfos();
    return <WhatIsGoingOnWithMember users={usersInfos} />;
}
