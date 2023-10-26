import { getMattermostAdmin } from "@/controllers/adminController/getMattermostAdmin";
import { AdminMattermost } from "@/legacyPages/AdminMattermostPage/AdminMattermost";
import { getServerSession } from "next-auth";

export default async function Page() {
    const session = await getServerSession();
    const props = await getMattermostAdmin({
        auth: { id: session?.user?.name },
    });
    return <AdminMattermost {...props} />;
}
