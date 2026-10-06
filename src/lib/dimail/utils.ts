import { Domaine, MemberType } from "@/models/member";

export const DIMAIL_MAILBOX_DOMAIN =
  process.env.DIMAIL_MAILBOX_DOMAIN || "beta.gouv.fr";

// an attributaire is identified by its domaine (entered at invitation) or by
// its member type (declared by the member afterwards)
export const isAttributaire = ({
  domaine,
  member_type,
}: {
  domaine?: string | null;
  member_type?: string | null;
}) =>
  domaine === Domaine.ATTRIBUTAIRE || member_type === MemberType.ATTRIBUTAIRE;

// add .ext to username if needed
// public agents (legal_status contractuel/fonctionnaire) get no suffix.
// when legal_status is not known yet (new members), fallback to the mission
// status entered at invitation : "admin" means a public agent.
// attributaires are external whatever their legal or mission status : always .ext
export const getDimailUsernameForUser = (
  username: string,
  legal_status?: string | null,
  missionStatus?: string | null,
  attributaire: boolean = false,
) => {
  if (attributaire) {
    return `${username}.ext`;
  }
  const isPublicAgent = legal_status
    ? ["contractuel", "fonctionnaire"].includes(legal_status)
    : missionStatus === "admin";
  return isPublicAgent ? username : `${username}.ext`;
};
