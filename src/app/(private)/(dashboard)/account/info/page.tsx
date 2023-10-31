"use client";
import { getDetailInfoUpdate } from "@/controllers/accountController/getDetailInfoUpdate";
import { InfoUpdate } from "@/legacyPages/InfoUpdatePage";
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
            .get(computeRoute(routes.ACCOUNT_GET_DETAIL_INFO_FORM_API), {
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

    // const props = await getDetailInfoUpdate({
    //     auth: { id: session?.user?.name },
    // });

    return <InfoUpdate {...data} />;
}
