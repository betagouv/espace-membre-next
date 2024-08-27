import { useEffect, useState } from "react";

import Button from "@codegouvfr/react-dsfr/Button";

import { unblockMemberEmailAddress } from "@/app/api/admin/action";
import {
    brevoEmailInfoDataSchema,
    brevoEmailInfoDataSchemaType,
} from "@/models/brevoInfo";

const UnblockAdminAction = ({ email }: { email: string }) => {
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

const MemberEmailServiceInfo = ({
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
        return (
            <div>
                <p>Pas d'information trouvée sur les emails dans brevo</p>
            </div>
        );

    return (
        <div>
            {emailServiceInfo.primaryEmail && (
                <li>
                    Email primaire blacklisté sur brevo :{" "}
                    {emailServiceInfo.primaryEmail.emailBlacklisted
                        ? "oui"
                        : "non"}
                    {isAdmin &&
                        emailServiceInfo.primaryEmail.emailBlacklisted && (
                            <UnblockAdminAction
                                email={emailServiceInfo.primaryEmail.email}
                            ></UnblockAdminAction>
                        )}
                </li>
            )}
            {emailServiceInfo.secondaryEmail && (
                <li>
                    Email secondaire blacklisté sur brevo :{" "}
                    {emailServiceInfo.secondaryEmail.emailBlacklisted
                        ? "oui"
                        : "non"}
                    {isAdmin &&
                        emailServiceInfo.secondaryEmail.emailBlacklisted && (
                            <UnblockAdminAction
                                email={emailServiceInfo.secondaryEmail.email}
                            ></UnblockAdminAction>
                        )}
                </li>
            )}
        </div>
    );
};

export default MemberEmailServiceInfo;
