"use client";
import axios from "axios";
import type { Metadata, ResolvingMetadata } from "next";
import React, { useEffect, useState } from "react";
import MemberPage, {
    MemberPageProps,
} from "@/components/MemberPage/MemberPage";
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
                    routes.GET_USER_API.replace(":username", params.id)
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
    return <MemberPage {...(data as MemberPageProps)} />;
}
