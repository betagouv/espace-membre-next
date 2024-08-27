import { useEffect, useState } from "react";

import Button from "@codegouvfr/react-dsfr/Button";

import { unblockMemberEmailAddress } from "@/app/api/admin/action";
import {
    brevoEmailInfoDataSchema,
    brevoEmailInfoDataSchemaType,
} from "@/models/brevoInfo";
import { SIBContact } from "@/server/infra/email/sendInBlue";

const ContactCard = (contact: SIBContact) => {
    // Parse and validate the data

    // Format the date for display
    const formattedDate = contact.blockedAt.toLocaleString();

    return (
        <table>
            <tbody>
                <tr>
                    <td>
                        <strong>Email:</strong>
                    </td>
                    <td>{contact.email}</td>
                </tr>
                <tr>
                    <td>
                        <strong>Raison:</strong>
                    </td>
                    <td>{contact.reason.message}</td>
                </tr>
                <tr>
                    <td>
                        <strong>Code:</strong>
                    </td>
                    <td>{contact.reason.code}</td>
                </tr>
                <tr>
                    <td>
                        <strong>Bloqué le :</strong>
                    </td>
                    <td>{formattedDate}</td>
                </tr>
                <tr>
                    <td>
                        <UnblockAdminAction
                            email={contact.email}
                        ></UnblockAdminAction>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

const UnblockAdminAction = ({ email }: { email: string }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const onClick = async () => {
        setLoading(true);
        await unblockMemberEmailAddress(email);
        setLoading(false);
    };
    return (
        <div>
            <Button size="small" disabled={loading} onClick={onClick}>
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
    if (
        !emailServiceInfo?.primaryEmail &&
        !emailServiceInfo?.secondaryEmail &&
        !emailServiceInfo?.primaryEmailTransac &&
        !emailServiceInfo?.secondaryEmailTransac
    )
        return <div>Pas d'information trouvée sur les emails dans brevo</div>;

    return (
        <div>
            {emailServiceInfo.primaryEmail && (
                <li>
                    Email primaire blacklisté sur les campagnes brevo :{" "}
                    {emailServiceInfo.primaryEmail.emailBlacklisted
                        ? "oui"
                        : "non"}
                </li>
            )}
            {emailServiceInfo.secondaryEmail && (
                <li>
                    Email secondaire blacklisté sur les campagnes brevo :{" "}
                    {emailServiceInfo.secondaryEmail.emailBlacklisted
                        ? "oui"
                        : "non"}
                </li>
            )}
            {emailServiceInfo.primaryEmailTransac && (
                <li>
                    Email primaire bloqué sur brevo en transactionnel :{" "}
                    {emailServiceInfo.primaryEmailTransac ? "oui" : "non"}
                    {isAdmin && emailServiceInfo.primaryEmailTransac && (
                        <ContactCard
                            {...emailServiceInfo.primaryEmailTransac}
                        />
                    )}
                </li>
            )}
            {emailServiceInfo.secondaryEmailTransac && (
                <li>
                    Email secondaire bloqué sur brevo :{" "}
                    {emailServiceInfo.secondaryEmailTransac ? "oui" : "non"}
                    {isAdmin && emailServiceInfo.secondaryEmailTransac && (
                        <ContactCard
                            {...emailServiceInfo.secondaryEmailTransac}
                        />
                    )}
                </li>
            )}
        </div>
    );
};

export default MemberEmailServiceInfo;
