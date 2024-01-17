"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { Onboarding, OnboardingProps } from "@/components/OnboardingPage";
import routes, { computeRoute } from "@/routes/routes";

export default function OnboardingClientPage() {
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

    return (
        <div className="fr-grid-row fr-grid-row--center">
            <Onboarding {...(data as OnboardingProps)} />
        </div>
    );
}
