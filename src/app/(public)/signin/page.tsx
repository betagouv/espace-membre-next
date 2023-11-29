import { Metadata } from "next";
import SignClientPage from "./SiginClientPage";

export const metadata: Metadata = {
    title: "Espace-Membre: me connecter",
};

export default function SignIn() {
    return <SignClientPage></SignClientPage>;
}
