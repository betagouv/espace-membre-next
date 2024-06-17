"use client";
import React, { useEffect, useState } from "react";

import axios from "axios";

import MemberPage, {
    MemberPageProps,
} from "@/components/MemberPage/MemberPage";
import { memberWrapperPublicInfoSchemaType } from "@/models/member";
import routes, { computeRoute } from "@/routes/routes";

type Props = {
    params: { id: string };
};

export default function Page({ params }: Props) {
    const [data, setData] = useState<memberWrapperPublicInfoSchemaType>();
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
    return <MemberPage {...memberWrapperPublicInfoSchemaType} />;
}
