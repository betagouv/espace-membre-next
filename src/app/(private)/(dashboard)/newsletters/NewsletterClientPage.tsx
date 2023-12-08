"use client";

import NewsletterPage, {
    NewsletterPageProps,
} from "@/components/NewsletterPage/NewsletterPage";
import React, { useEffect, useState } from "react";
import axios from "axios";
import routes, { computeRoute } from "@/routes/routes";

type Props = {
    params: { id: string };
};

export default function Page({ params }: Props) {
    const [data, setData] = useState();
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.NEWSLETTERS_API), {
                withCredentials: true,
            })
            .then((res) => {
                setData(res.data);
                setLoading(false);
            });
    }, [params.id]);

    if (isLoading) return <p>Chargement....</p>;
    if (!data) return <p>No profile data</p>;

    return <NewsletterPage {...(data as NewsletterPageProps)} />;
}
