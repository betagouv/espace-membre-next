export function EmailCreatedDimailTitle(variables?: { resend?: boolean }) {
  return variables?.resend
    ? "Nouveau lien d'accès à ta boîte mail betagouv"
    : "Ta boite mail betagouv est prête 🙂";
}
