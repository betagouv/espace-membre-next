import { Metadata } from "next";

import SignClientPage from "./SiginClientPage";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.signIn()} / Espace Membre`,
};

export default function SignIn() {
    return <SignClientPage></SignClientPage>;
}
