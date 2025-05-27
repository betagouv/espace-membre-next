import type { Metadata } from "next";

import { WhatIsGoingOnWithMember } from "@/components/WhatIsGoingOnWithMemberPage";
// import { getAllUsersPublicInfo } from "@/server/db/dbUser";
import { getAllStartups } from "@/lib/kysely/queries";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberPublicInfoToModel, startupToModel } from "@/models/mapper";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.keskispasse()} / Espace Membre`,
};

export default async function Page() {
    const usersInfos = (await getAllUsersInfo()).map((user) =>
        memberPublicInfoToModel(user),
    );
    const startups = (await getAllStartups()).map((startup) =>
        startupToModel(startup),
    );
    return <WhatIsGoingOnWithMember startups={startups} users={usersInfos} />;
}
