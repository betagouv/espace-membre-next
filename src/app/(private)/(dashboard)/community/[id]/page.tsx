import MemberPage from "@/components/MemberPage/MemberPage";
import { getUser } from "@/controllers/communityController/getUser";

export default async function Page({ params }: { params: { id: string } }) {
    const res = await getUser({ id: params.id })
    const props = await getUser({ id: params.id }) //props
    return <MemberPage {...props}/>
}