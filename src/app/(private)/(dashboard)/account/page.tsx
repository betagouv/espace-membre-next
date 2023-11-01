"use client";
import React, { useEffect, useState } from "react";
import AccountPage from "@/components/AccountPage/AccountPage";
import axios from "axios";
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
                console.log(res.data);
                setData(res.data);
                setLoading(false);
            });
    }, []);

    if (isLoading) return <p>Loading...</p>;
    if (!data) return <p>No profile data</p>;

    // const props: any = await getCurrentAccount({
    //     auth: { id: session?.user?.name },
    // });
    // let props = {};

    return <AccountPage {...data} />;
}
