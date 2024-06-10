import type { Metadata } from "next";

import { WhatIsGoingOnWithMember } from "@/components/WhatIsGoingOnWithMemberPage";
// import { getAllUsersPublicInfo } from "@/server/db/dbUser";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberPublicInfoToModel } from "@/models/mapper";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.keskispasse()} / Espace Membre`,
};

export default async function Page() {
    const usersInfos = (await getAllUsersInfo()).map((user) =>
        memberPublicInfoToModel(user)
    );
    return <WhatIsGoingOnWithMember users={usersInfos} />;
}
