import { useEffect, useState } from "react";

import Button from "@codegouvfr/react-dsfr/Button";

import { unblockMemberEmailAddress } from "@/app/api/admin/action";
import {
    brevoEmailInfoDataSchema,
    brevoEmailInfoDataSchemaType,
} from "@/models/brevoInfo";

const UnblockAdminAction = ({ email }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const onClick = async () => {
        setLoading(true);
        await unblockMemberEmailAddress(email);
        setLoading(false);
    };
    return (
        <div>
            <Button disabled={loading} onClick={onClick}>
                {loading
                    ? `Débloquage de l'email en cours ...`
                    : `Débloquer l'email`}
            </Button>
        </div>
    );
};

const MemberBrevoEventList = ({
    userId,
    isAdmin,
}: {
    userId: string;
    isAdmin: boolean;
}) => {
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
                    {emailServiceInfo.primaryEmail.emailBlacklisted && (
                        <UnblockAdminAction
                            email={emailServiceInfo.primaryEmail}
                        ></UnblockAdminAction>
                    )}
                </li>
            )}
            {emailServiceInfo.secondaryEmail && (
                <li>
                    Email secondaire blacklisté sur brevo :{" "}
                    {emailServiceInfo.secondaryEmail.emailBlacklisted
                        ? "oui"
                        : "non"}{emailServiceInfo.secondaryEmail.emailBlacklisted && (
                        <UnblockAdminAction
                            email={emailServiceInfo.secondaryEmail}
                        ></UnblockAdminAction>
                    )}
                </li>
            )}
        </div>
    );
};

export default MemberBrevoEventList;
