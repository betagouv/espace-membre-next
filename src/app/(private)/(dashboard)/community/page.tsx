import type { Metadata } from "next";
import CommunityClientPage from "./CommunityClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.community()} / Espace Membre`,
};

export default function Page(props) {
    return <CommunityClientPage {...props} />;
}
