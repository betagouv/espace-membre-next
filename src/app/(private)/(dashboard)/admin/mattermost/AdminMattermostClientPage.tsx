"use client";
import { useEffect, useState } from "react";

import axios from "axios";
import type { Metadata } from "next";

import { safeGetMattermostInfo } from "@/app/api/admin/actions/getMattermostAdmin";
import {
    AdminMattermost,
    AdminMattermostProps,
} from "@/components/AdminMattermostPage/AdminMattermost";
import routes, { computeRoute } from "@/routes/routes";

export default function Page() {
    const [data, setData] = useState({});
    const [isLoading] = useState(true);
    useEffect(() => {
        async function fetchData() {
            const res = await safeGetMattermostInfo();
            setData(res.data || {});
        }
        fetchData();
    }, []);

    if (isLoading) return <p>Chargement...</p>;
    if (!data) return <p>No profile data</p>;

    return <AdminMattermost {...(data as AdminMattermostProps)} />;
}
