"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import routes, { computeRoute } from "@/routes/routes";
import { Badge } from "@/components/BadgePage/BadgePage";

export default function Page() {
    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.ACCOUNT_GET_API), {
                withCredentials: true,
            })
            .then((res) => {
                console.log(res.data);
                setData(res.data);
                setLoading(false);
            });
    }, []);

    if (isLoading) return <p>Chargement...</p>;
    if (!data) return <p>No profile data</p>;

    return <Badge />;
}
