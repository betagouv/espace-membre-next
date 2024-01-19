"use client";
import axios from "axios";
import type { Metadata } from "next";
import { useEffect, useState } from "react";

import {
    BaseInfoUpdate,
    BaseInfoUpdateProps,
} from "@/components/BaseInfoUpdatePage";
import routes, { computeRoute } from "@/routes/routes";
import { getServerSession } from "next-auth";

export default function Page() {
    // const session = await getServerSession();
    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);
    console.log("data", data);
    useEffect(() => {
        axios
            .get(computeRoute(routes.ACCOUNT_GET_BASE_INFO_FORM_API), {
                withCredentials: true,
            })
            .then((res) => {
                setData(res.data);
                setLoading(false);
            });
    }, []);

    if (isLoading) return <p>Chargement...</p>;
    if (!data) return <p>No profile data</p>;

    // const props: BaseInfoUpdateProps = (await getBaseInfoUpdate({
    //     auth: { id: session?.user?.name },
    // })) as BaseInfoUpdateProps;

    return <BaseInfoUpdate {...(data as BaseInfoUpdateProps)} />;
}
