import { getStartupInfoCreate } from "@/controllers/startupController/getStartupInfoCreate";
import {
    StartupInfoCreate,
    StartupInfoCreateProps,
} from "@/legacyPages/StartupInfoCreatePage";

export default async function Page({ params }: { params: { id: string } }) {
    const props: StartupInfoCreateProps = await getStartupInfoCreate();
    return <StartupInfoCreate {...props}></StartupInfoCreate>;
}
