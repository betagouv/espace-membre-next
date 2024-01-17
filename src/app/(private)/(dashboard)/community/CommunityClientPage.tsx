"use client";
import axios from "axios";
import type { Metadata } from "next";
import { useEffect, useState } from "react";
import { Community, CommunityProps } from "@/components/CommunityPage";
import routes, { computeRoute } from "@/routes/routes";

export default function Page() {
    const props = {};
    const [data, setData] = useState();
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.GET_COMMUNITY_API), {
                withCredentials: true,
            })
            .then((res) => {
                setData(res.data);
                setLoading(false);
            });
    }, []);

    if (isLoading) return <p>Chargement...</p>;
    if (!data) return <p>No profile data</p>;
    return <Community {...(data as CommunityProps)} />;
}
