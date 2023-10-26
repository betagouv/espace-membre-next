import betagouv from "@/betagouv";
import config from "@/config";
import crypto from 'crypto';

export function checkUserIsExpired(user, minDaysOfExpiration = 1) {
    // Le membre est considéré comme expiré si:
    // - il/elle existe
    // - il/elle a une date de fin
    // - son/sa date de fin est passée
  
    if (!user || user.end === undefined)
      return false;
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const userEndDate = new Date(user.end);
    if (userEndDate.toString() === "Invalid Date")
      return false;
    userEndDate.setHours(0, 0, 0, 0);
  
    return userEndDate.getTime() + (minDaysOfExpiration * 24 * 3600 * 1000) <=
        today.getTime();
  }

  export const computeHash = function(username) {
    const hash = crypto.createHmac('sha512', config.HASH_SALT); /** Hashing algorithm sha512 */
    return hash.update(username).digest('hex');
  }
  

export async function userInfos(id, isCurrentUser) {
    try {
      const [userInfos, emailInfos, redirections,
       responder
      ] = await Promise.all([
        betagouv.userInfosById(id),
        betagouv.emailInfos(id),
        betagouv.redirectionsForId({ from: id }),
        betagouv.getResponder(id)
      ]);
      const hasUserInfos = userInfos !== undefined;
  
      const isExpired = checkUserIsExpired(userInfos);
  
      // On ne peut créé un compte que si:
      // - la page fiche Github existe
      // - le membre n'est pas expiré·e
      // - et le compte n'existe pas
      const canCreateEmail =
        hasUserInfos &&
        !isExpired &&
        emailInfos === null;
      // On peut créer une redirection & changer un password si:
      // - la page fiche Github existe
      // - le membre n'est pas expiré·e (le membre ne devrait de toute façon pas pouvoir se connecter)
      // - et que l'on est le membre connecté·e pour créer ces propres redirections.
      const canCreateRedirection = !!(
        hasUserInfos &&
        !isExpired &&
        isCurrentUser
      );
      const canChangePassword = !!(
        hasUserInfos &&
        !isExpired &&
        isCurrentUser &&
        emailInfos
      );
  
      const canChangeEmails = !!(
        hasUserInfos &&
        !isExpired &&
        isCurrentUser
      );
  
      return {
        emailInfos,
        redirections,
        userInfos,
        isExpired,
        canCreateEmail,
        canCreateRedirection,
        canChangePassword,
        canChangeEmails,
        responder
      };
    } catch (err) {
      console.error(err);
  
      throw new Error(`Problème pour récupérer les infos du membre ${id}`);
    }
  }