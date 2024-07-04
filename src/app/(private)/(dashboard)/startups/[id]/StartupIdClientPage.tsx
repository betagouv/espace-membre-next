"use client";

import React, { useEffect, useState } from "react";

import axios from "axios";
import { Metadata, ResolvingMetadata } from "next";

import StartupPage, {
    StartupPageProps,
} from "@/components/StartupPage/StartupPage";
import routes, { computeRoute } from "@/routes/routes";

type Props = {
    params: { id: string };
};

export default function Page({ params }: Props) {
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
