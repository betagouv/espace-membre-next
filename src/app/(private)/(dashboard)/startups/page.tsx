// import { getStartupList } from "@/controllers/startupController"
// import { StartupList, StartupListProps } from "@/legacyPages/StartupListPage"

// export default async function Page({ params }: { params: { id: string } }) {
//     const props: StartupListProps = await getStartupList({ startup: params.id })
//     return <StartupList {...props}></StartupList>
// }

"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";
import { StartupList, StartupListProps } from "@/legacyPages/StartupListPage";

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
            .get(computeRoute(routes.STARTUP_GET_ALL_API), {
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

    return <StartupList {...data} />;
}
