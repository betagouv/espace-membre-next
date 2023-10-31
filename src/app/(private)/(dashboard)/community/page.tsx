import { getCommunity } from "@/controllers/communityController/getCommunity";
import { Community, CommunityProps } from "@/legacyPages/CommunityPage";

export default async function Page() {
    const props: CommunityProps = await getCommunity();
    return <Community {...props} />;
}
