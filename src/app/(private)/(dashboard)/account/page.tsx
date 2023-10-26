import React from "react";
import AccountPage from "@/components/AccountPage/AccountPage";
import { getCurrentAccount } from "@/controllers/accountController/getCurrentAccount";
import { getServerSession } from "next-auth";

export default async function Page() {
    const session = await getServerSession();
    const props: any = await getCurrentAccount({
        auth: { id: session?.user?.name },
    });

    return <AccountPage {...props} />;
}
