import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import SignClientPage from "./SiginClientPage";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
    title: `${routeTitles.signIn()} / Espace Membre`,
};

export default async function SignIn() {
    const session = await getServerSession(authOptions);

    if (session && session.user.id) {
        return redirect("/dashboard");
    }

    return <SignClientPage></SignClientPage>;
}
