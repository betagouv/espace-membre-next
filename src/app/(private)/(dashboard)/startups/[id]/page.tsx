"use client";

import StartupPage, {
    StartupPageProps,
} from "@/components/StartupPage/StartupPage";
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
                    routes.STARTUP_GET_DETAIL_API.replace(":startup", params.id)
                ),
                {
                    withCredentials: true,
                }
            )
            .then((res) => {
                setData(res.data);
                setLoading(false);
            });
    }, [params.id]);

    if (isLoading) return <p>Chargement....</p>;
    if (!data) return <p>No profile data</p>;

    return <StartupPage {...(data as StartupPageProps)} />;
}
