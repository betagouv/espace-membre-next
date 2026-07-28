import { getAdmin } from "@/server/config/admin.config";
import { getAnimation } from "@/server/config/animation.config";

/**
 * Droit de cocher/décocher un item de checklist réservé, cf.
 * src/utils/checklists/restrictedChecklistItems.ts.
 *
 * Lit les listes serveur issues de l'environnement. Ne jamais se baser sur un
 * booléen porté par la session ou par le client pour autoriser l'écriture.
 *
 * @param username session.user.id, c'est à dire users.username : c'est la clé
 * sur laquelle ESPACE_MEMBRE_ADMIN et ESPACE_MEMBRE_ANIMATION sont indexés.
 */
export const canValidateRestrictedChecklistItem = (
  username?: string | null,
): boolean => {
  if (!username) return false;
  return getAdmin().includes(username) || getAnimation().includes(username);
};
