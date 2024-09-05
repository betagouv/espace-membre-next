"use client";

import React, { useEffect, useState } from "react";

import axios from "axios";

import NewsletterPage, {
    NewsletterPageProps,
} from "@/components/NewsletterPage/NewsletterPage";
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
    if (!data || !(data as NewsletterPageProps).newsletters)
        return <p>Il n'y a pas de données</p>;

    return <NewsletterPage {...(data as NewsletterPageProps)} />;
}
