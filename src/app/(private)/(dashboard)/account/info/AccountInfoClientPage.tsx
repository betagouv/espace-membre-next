"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { InfoUpdate, InfoUpdateProps } from "@/components/InfoUpdatePage";
import routes, { computeRoute } from "@/routes/routes";

export default function Page() {
    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.ACCOUNT_GET_DETAIL_INFO_FORM_API), {
                withCredentials: true,
            })
            .then((res) => {
                setData(res.data);
                setLoading(false);
            });
    }, []);

    if (isLoading) return <p>Chargement...</p>;
    if (!data) return <p>No profile data</p>;

    return <InfoUpdate {...(data as InfoUpdateProps)} />;
}
