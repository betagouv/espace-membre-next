"use client";

// import { getStartupInfoCreate } from "@/controllers/startupController/getStartupInfoCreate";
import {
    StartupInfoCreate,
    StartupInfoCreateProps,
} from "@/legacyPages/StartupInfoCreatePage";
import React, { useEffect, useState } from "react";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";

export default function Page() {
    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.STARTUP_GET_INFO_CREATE_FORM_API), {
                withCredentials: true,
            })
            .then((res) => {
                setData(res.data);
                setLoading(false);
            });
    }, []);

    if (isLoading) return <p>Chargement....</p>;
    if (!data) return <p>No profile data</p>;

    return <StartupInfoCreate {...(data as StartupInfoCreateProps)} />;
}
