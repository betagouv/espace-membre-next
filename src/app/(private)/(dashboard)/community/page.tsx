"use client";
// import { getCommunity } from "@/controllers/communityController/getCommunity";
import { Community, CommunityProps } from "@/legacyPages/CommunityPage";
import routes, { computeRoute } from "@/routes/routes";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Page() {
    // const props: CommunityProps = await getCommunity();
    const props = {};
    const [data, setData] = useState();
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.GET_COMMUNITY_API), {
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
    return <Community {...(data as CommunityProps)} />;
}
