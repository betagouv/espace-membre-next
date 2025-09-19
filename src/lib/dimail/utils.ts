export const DIMAIL_MAILBOX_DOMAIN =
  process.env.DIMAIL_MAILBOX_DOMAIN || "beta.gouv.fr";

// add .ext to username if needed
export const getDimailUsernameForUser = (
  username: string,
  legal_status?: string,
) => {
  const fullUsername = ["contractuel", "fonctionnaire"].includes(
    legal_status || "",
  )
    ? username
    : `${username}.ext`;
  return fullUsername;
};
