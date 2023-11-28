import { Metadata } from "next";
import StartupClientPage from "./StartupClientPage";

export const metadata: Metadata = {
    title: "Espace-Membre: rechercher un produit",
};

export default function Page() {
    return <StartupClientPage />;
}
