import StartupPage from "@/components/StartupPage/StartupPage";
import { getStartup } from "@/controllers/startupController";

export default async function Page({ params }: { params: { id: string } }) {
    const props = await getStartup({ startup: params.id });
    return <StartupPage {...props} />;
}
