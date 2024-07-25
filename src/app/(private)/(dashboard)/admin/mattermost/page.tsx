import type { Metadata } from "next";

import AdminMattermostClientPage from "./AdminMattermostClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.adminMattermost()} / Espace Membre`,
};

export default function Page(props) {
    return <AdminMattermostClientPage {...props} />;
}
