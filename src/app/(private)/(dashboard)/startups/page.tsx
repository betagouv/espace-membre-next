import { getStartupList } from "@/controllers/startupController"
import { StartupList, StartupListProps } from "@/legacyPages/StartupListPage"

export default async function Page({ params }: { params: { id: string } }) {
    const props: StartupListProps = await getStartupList({ startup: params.id })
    return <StartupList {...props}></StartupList>
}
