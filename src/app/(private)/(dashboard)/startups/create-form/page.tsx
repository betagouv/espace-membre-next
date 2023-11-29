import { Metadata } from "next";
import StartupCreateFormClientPage from "./StartupCreateFormClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.startupCreate()} / Espace Membre`,
};

export default function Page(props) {
    return (
        <>
            <h1>{routeTitles.startupCreate()}</h1>
            <StartupCreateFormClientPage {...props} />
        </>
    );
}
