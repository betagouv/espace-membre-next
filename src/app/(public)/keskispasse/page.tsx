import type { Metadata } from "next";

import { WhatIsGoingOnWithMember } from "@/components/WhatIsGoingOnWithMemberPage";
import betagouv from "@/server/betagouv";
import { getAllUsersPublicInfo } from "@/server/db/dbUser";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.keskispasse()} / Espace Membre`,
};

export default async function Page() {
    const usersInfos = await getAllUsersPublicInfo();
    return <WhatIsGoingOnWithMember users={usersInfos} />;
}
