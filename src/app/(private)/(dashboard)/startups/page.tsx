import { Metadata } from "next";
import StartupClientPage from "./StartupClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.startupList()} / Espace Membre`,
};

export default function Page() {
    return (
        <>
            <h1>{routeTitles.startupList()}</h1>
            <StartupClientPage />;
        </>
    );
}
