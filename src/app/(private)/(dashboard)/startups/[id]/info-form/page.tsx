import { getStartupInfoUpdate } from "@/controllers/startupController"
import { StartupInfoUpdate, StartupInfoUpdateProps } from "@/legacyPages/StartupInfoUpdatePage"

export default async function Page({ params }: { params: { id: string } }) {
    const props: StartupInfoUpdateProps = await getStartupInfoUpdate({ id: params.id })
    return <StartupInfoUpdate {...props}/>
}
