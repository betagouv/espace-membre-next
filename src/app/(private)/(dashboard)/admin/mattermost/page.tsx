"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";
import {
    AdminMattermost,
    AdminMattermostProps,
} from "@/legacyPages/AdminMattermostPage/AdminMattermost";

export default function Page() {
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

    return <AdminMattermost {...(data as AdminMattermostProps)} />;
}
