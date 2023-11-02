"use client";
import { Onboarding, OnboardingProps } from "@/legacyPages/OnboardingPage";
import routes, { computeRoute } from "@/routes/routes";
import axios from "axios";
import { useEffect, useState } from "react";
// import { getForm } from "@/controllers/onboardingController/getOnboardingForm";

export default function Page() {
    const props = {}; // await getForm({}, {});
    const [data, setData] = useState({});
    const [isLoading, setLoading] = useState(true);
    useEffect(() => {
        axios
            .get(computeRoute(routes.ONBOARDING_API), {
                withCredentials: true,
            })
            .then((res) => {
                setData(res.data);
                setLoading(false);
            });
    }, []);

    if (isLoading) return <p>Chargement...</p>;
    if (!data) return <p>No profile data</p>;

    return <Onboarding {...(data as OnboardingProps)} />;
}
