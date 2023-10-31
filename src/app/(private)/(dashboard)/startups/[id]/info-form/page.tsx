// import { getStartupInfoUpdate } from "@/controllers/startupController"
// import { StartupInfoUpdate, StartupInfoUpdateProps } from "@/legacyPages/StartupInfoUpdatePage"

// export default async function Page({ params }: { params: { id: string } }) {
//     const props: StartupInfoUpdateProps = await getStartupInfoUpdate({ id: params.id })
//     return <StartupInfoUpdate {...props}/>
// }

"use client";

import {
    StartupInfoUpdate,
    StartupInfoUpdateProps,
} from "@/legacyPages/StartupInfoUpdatePage";

import React, { useEffect, useState } from "react";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";

export default function Page({ params }: { params: { id: string } }) {
    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(
                computeRoute(
                    routes.STARTUP_GET_INFO_UPDATE_FORM_API.replace(
                        ":startup",
                        params.id
                    )
                ),
                {
                    withCredentials: true,
                }
            )
            .then((res) => {
                setData(res.data);
                setLoading(false);
            });
    }, []);

    if (isLoading) return <p>Loading...</p>;
    if (!data) return <p>No profile data</p>;

    return <StartupInfoUpdate {...data} />;
}
