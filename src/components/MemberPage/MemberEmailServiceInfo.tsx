import { useEffect, useState } from "react";

import {
    brevoEmailInfoDataSchema,
    brevoEmailInfoDataSchemaType,
} from "@/models/brevoInfo";

const MemberBrevoEventList = ({ userId }) => {
    const [emailServiceInfo, setEmailServiceInfo] =
        useState<brevoEmailInfoDataSchemaType>();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!userId) return;

            setLoading(true);
            try {
                const response = await fetch(
                    `/api/member/${userId}/brevo-emails-info`
                );
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                setEmailServiceInfo(brevoEmailInfoDataSchema.parse(data));
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    if (!emailServiceInfo?.primaryEmail && !emailServiceInfo?.secondaryEmail)
        return <div>Pas d'information trouvée sur les emails dans brevo</div>;

    return (
        <div>
            {emailServiceInfo.primaryEmail && (
                <li>
                    Email primaire blacklisté sur brevo :{" "}
                    {emailServiceInfo.primaryEmail.emailBlacklisted
                        ? "oui"
                        : "non"}
                </li>
            )}
            {emailServiceInfo.secondaryEmail && (
                <li>
                    Email secondaire blacklisté sur brevo :{" "}
                    {emailServiceInfo.secondaryEmail.emailBlacklisted
                        ? "oui"
                        : "non"}
                </li>
            )}
        </div>
    );
};

export default MemberBrevoEventList;
