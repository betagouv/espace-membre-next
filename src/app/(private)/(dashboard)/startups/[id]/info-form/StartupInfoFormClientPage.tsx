"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Metadata, ResolvingMetadata } from "next";
import routes, { computeRoute } from "@/routes/routes";
import {
    StartupInfoUpdate,
    StartupInfoUpdateProps,
} from "@/legacyPages/StartupInfoUpdatePage";

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
    }, [params.id]);

    if (isLoading) return <p>Chargement...</p>;
    if (!data) return <p>No profile data</p>;

    return <StartupInfoUpdate {...(data as StartupInfoUpdateProps)} />;
}
