import { getDetailInfoUpdate } from "@/controllers/accountController/getDetailInfoUpdate";
import { InfoUpdate } from "@/legacyPages/InfoUpdatePage";
import { getServerSession } from "next-auth";

export default async function Page() {
    const session = await getServerSession();
    const props = await getDetailInfoUpdate({
        auth: { id: session?.user?.name },
    });

    return <InfoUpdate {...props} />;
}
