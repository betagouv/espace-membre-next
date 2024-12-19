import { isAfter, isBefore } from "date-fns";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { CreateMatomoServiceForm } from "@/components/Service/CreateMatomoServiceForm";
import { StartupType } from "@/components/SESelect";
import { getAllStartups } from "@/lib/kysely/queries";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import { getUserStartups } from "@/lib/kysely/queries/users";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { SERVICES } from "@/models/services";
import { authOptions } from "@/utils/authoptions";

export default async function NewMatomoPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    const rawAccount = await getServiceAccount(
        session.user.uuid,
        SERVICES.MATOMO
    );

    const now = new Date();
    const startups = session.user.isAdmin
        ? await getAllStartups()
        : (await getUserStartups(session.user.uuid))
              .filter((startup) => {
                  return (
                      isAfter(now, startup.start ?? 0) &&
                      isBefore(now, startup.end ?? Infinity)
                  );
              })
              .map((startup) => userStartupToModel(startup));

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
