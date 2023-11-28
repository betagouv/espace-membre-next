import type { Metadata } from "next";
import AdminMattermostClientPage from "./AdminMattermostClientPage";

export const metadata: Metadata = {
    title: "Espace-Membre: Administration mattermost",
};

export default function Page(props) {
    return <AdminMattermostClientPage {...props} />;
}
