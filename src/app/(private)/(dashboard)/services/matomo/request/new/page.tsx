import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { CreateMatomoServiceForm } from "@/components/Service/CreateMatomoServiceForm";
import { StartupType } from "@/components/SESelect";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserStartupsActive } from "@/lib/kysely/queries/users";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { authOptions } from "@/utils/authoptions";

export default async function NewMatomoPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const now = new Date();
    const startups = session.user.isAdmin
        ? await getAllStartups()
        : (await getUserStartupsActive(session.user.uuid)).map((startup) =>
              userStartupToModel(startup)
          );

    const startupOptions: StartupType[] = startups.map((startup) => ({
        value: startup.uuid,
        label: startup.name,
    }));

    return (
        <>
            <h1>Ajouter un accès a un site matomo</h1>
            <CreateMatomoServiceForm startupOptions={startupOptions} />
        </>
    );
}
