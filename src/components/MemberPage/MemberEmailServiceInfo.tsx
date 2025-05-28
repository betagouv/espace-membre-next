import { useEffect, useState } from "react";

import Button from "@codegouvfr/react-dsfr/Button";

import {
  unblockMemberEmailAddress,
  unblockMemberEmailAddressFromCampaign,
} from "@/app/api/admin/actions";
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
              type={"smtp"}
              email={contact.email}
            ></UnblockAdminAction>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

const UnblockAdminAction = ({
  email,
  type,
}: {
  email: string;
  type: "campaign" | "smtp";
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const onClick = async () => {
    setLoading(true);
    if (type === "smtp") {
      await unblockMemberEmailAddress(email);
    } else {
      await unblockMemberEmailAddressFromCampaign(email);
    }
    setLoading(false);
  };
  return (
    <div>
      <Button size="small" disabled={loading} onClick={onClick}>
        {loading ? `Débloquage de l'email en cours ...` : `Débloquer l'email`}
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
      // todo: move to server-side
      setLoading(true);
      try {
        const response = await fetch(`/api/member/${userId}/brevo-emails-info`);
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
          {emailServiceInfo.primaryEmail.emailBlacklisted ? "oui" : "non"}
          {emailServiceInfo.primaryEmail.emailBlacklisted && (
            <UnblockAdminAction
              type="campaign"
              email={emailServiceInfo.primaryEmail.email}
            ></UnblockAdminAction>
          )}
        </li>
      )}
      {emailServiceInfo.secondaryEmail && (
        <li>
          Email secondaire blacklisté sur les campagnes brevo :{" "}
          {emailServiceInfo.secondaryEmail.emailBlacklisted ? "oui" : "non"}
          {emailServiceInfo.secondaryEmail.emailBlacklisted && (
            <UnblockAdminAction
              type="campaign"
              email={emailServiceInfo.secondaryEmail.email}
            ></UnblockAdminAction>
          )}
        </li>
      )}
      {
        <li>
          Email primaire bloqué sur brevo en transactionnel :{" "}
          {emailServiceInfo.primaryEmailTransac ? "oui" : "non"}
          {isAdmin && emailServiceInfo.primaryEmailTransac && (
            <ContactCard {...emailServiceInfo.primaryEmailTransac} />
          )}
        </li>
      }
      {
        <li>
          Email secondaire bloqué sur brevo :{" "}
          {emailServiceInfo.secondaryEmailTransac ? "oui" : "non"}
          {isAdmin && emailServiceInfo.secondaryEmailTransac && (
            <ContactCard {...emailServiceInfo.secondaryEmailTransac} />
          )}
        </li>
      }
    </div>
  );
};

export default MemberEmailServiceInfo;
