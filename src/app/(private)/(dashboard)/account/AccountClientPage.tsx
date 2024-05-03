"use client";
import axios from "axios";
import type { Metadata } from "next";
import { useEffect, useState } from "react";
import AccountPage from "@/components/AccountPage/AccountPage";
import routes, { computeRoute } from "@/routes/routes";

export default function Page() {
    // const session = await getServerSession();

    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.ACCOUNT_GET_API), {
                withCredentials: true,
            })
            .then((res) => {
                setData(res.data);
                setLoading(false);
            });
    }, []);

    if (isLoading) return <p>Chargement...</p>;
    if (!data) return <p>No profile data</p>;

    // const props: any = await getCurrentAccount({
    //     auth: { id: session?.user?.name },
    // });
    // let props = {};
    return <AccountPage {...data} />;
}
