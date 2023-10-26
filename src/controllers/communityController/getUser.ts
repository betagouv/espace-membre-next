import { MemberWithPermission } from "@/models/member";
import { userInfos } from "../userUtils";
import db from "@/db";
import config from "@/config";
import { EMAIL_STATUS_READABLE_FORMAT } from "@/models/misc";
import betagouv from "@/betagouv";

export async function getUser({ id }) {
    const username = id;
    const isCurrentUser = id === username;
  
    try {  
      const [user] : [MemberWithPermission] = await Promise.all([
        userInfos(username, isCurrentUser),
      ]);
  
      const hasGithubFile = user.userInfos;
      const hasEmailAddress = (user.emailInfos || user.redirections.length > 0);
      if (!hasGithubFile && !hasEmailAddress) {
        // req.flash('error', 'Il n\'y a pas de membres avec ce compte mail. Vous pouvez commencez par créer une fiche sur Github pour la personne <a href="/onboarding">en cliquant ici</a>.');
        return;
      }
      const marrainageStateResponse = await db('marrainage').select()
        .where({ username });
      const marrainageState = marrainageStateResponse[0];
  
      const dbUser = await db('users').where({ username }).first()
      const secondaryEmail = dbUser ? dbUser.secondary_email : '';
      let availableEmailPros = []
      if (config.ESPACE_MEMBRE_ADMIN.includes(id)) {
        availableEmailPros = await betagouv.getAvailableProEmailInfos()
      }
      const title = user.userInfos ? user.userInfos.fullname : null;
      return {
        title,
        username,
        currentUserId: id,
        emailInfos: user.emailInfos,
        redirections: user.redirections,
        userInfos: user.userInfos,
        isExpired: user.isExpired,
        isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(id),
        availableEmailPros,
        primaryEmail: dbUser ? dbUser.primary_email : '',
        primaryEmailStatus: dbUser ? EMAIL_STATUS_READABLE_FORMAT[dbUser.primary_email_status] : '',
        canCreateEmail: user.canCreateEmail,
        hasPublicServiceEmail: dbUser && dbUser.primary_email && !dbUser.primary_email.includes(config.domain),
        // errors: req.flash('error'),
        // messages: req.flash('message'),
        domain: config.domain,
        marrainageState,
        activeTab: 'community',
        secondaryEmail,
      }
    } catch (err) {
        console.log(err)
      throw new Error(`Impossible de récupérer les informations du membre de la communauté.${err}` );
    }
  }


  