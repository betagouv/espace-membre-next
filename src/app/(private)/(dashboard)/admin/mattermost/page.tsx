"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";
import { getMattermostAdmin } from "@/controllers/adminController/getMattermostAdmin";
import { AdminMattermost } from "@/legacyPages/AdminMattermostPage/AdminMattermost";
import { getServerSession } from "next-auth";

export default function Page() {
    // const session = await getServerSession();
    // const props = await getMattermostAdmin({
    //     auth: { id: session?.user?.name },
    // });

    // const session = await getServerSession();

    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.ADMIN_MATTERMOST_API), {
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

    return <AdminMattermost {...data} />;
}
