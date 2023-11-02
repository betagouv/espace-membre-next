"use client";
import {
    BaseInfoUpdate,
    BaseInfoUpdateProps,
} from "@/legacyPages/BaseInfoUpdatePage";
import routes, { computeRoute } from "@/routes/routes";
import axios from "axios";
import { getServerSession } from "next-auth";
import { useEffect, useState } from "react";

export default function Page() {
    // const session = await getServerSession();
    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.ACCOUNT_GET_BASE_INFO_FORM_API), {
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

    // const props: BaseInfoUpdateProps = (await getBaseInfoUpdate({
    //     auth: { id: session?.user?.name },
    // })) as BaseInfoUpdateProps;

    return <BaseInfoUpdate {...(data as BaseInfoUpdateProps)} />;
}
