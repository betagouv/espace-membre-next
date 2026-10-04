export const DIMAIL_MAILBOX_DOMAIN =
  process.env.DIMAIL_MAILBOX_DOMAIN || "beta.gouv.fr";

// add .ext to username if needed
// public agents (legal_status contractuel/fonctionnaire) get no suffix.
// when legal_status is not known yet (new members), fallback to the mission
// status entered at invitation : "admin" means a public agent.
export const getDimailUsernameForUser = (
  username: string,
  legal_status?: string | null,
  missionStatus?: string | null,
) => {
  const isPublicAgent = legal_status
    ? ["contractuel", "fonctionnaire"].includes(legal_status)
    : missionStatus === "admin";
  return isPublicAgent ? username : `${username}.ext`;
};
