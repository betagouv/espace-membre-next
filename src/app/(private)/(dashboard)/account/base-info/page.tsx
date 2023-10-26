import { getBaseInfoUpdate } from "@/controllers/usersController/baseInfo/getBaseInfoUpdate";
import {
    BaseInfoUpdate,
    BaseInfoUpdateProps,
} from "@/legacyPages/BaseInfoUpdatePage";
import { getServerSession } from "next-auth";

export default async function Page() {
    const session = await getServerSession();
    const props: BaseInfoUpdateProps = (await getBaseInfoUpdate({
        auth: { id: session?.user?.name },
    })) as BaseInfoUpdateProps;
    return <BaseInfoUpdate {...props} />;
}
