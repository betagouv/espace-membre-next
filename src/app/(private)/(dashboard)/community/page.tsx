import type { Metadata } from "next";
import CommunityClientPage from "./CommunityClientPage";

export const metadata: Metadata = {
    title: "Espace-Membre: Communauté",
};

export default function Page(props) {
    return <CommunityClientPage {...props} />;
}
