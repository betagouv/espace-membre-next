import { Metadata } from "next";
import StartupCreateFormClientPage from "./StartupCreateFormClientPage";

export const metadata: Metadata = {
    title: "Espace-Membre: créer un produit",
};

export default function Page(props) {
    return <StartupCreateFormClientPage {...props} />;
}
