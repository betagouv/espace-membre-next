import betagouv from "@/betagouv";
import config from "@/config";
import { Startup } from "@/models/startup";

export async function getStartupList({ startup }: { startup: string}) {
    try {
      const startups: Startup[] = await betagouv.startupInfos()
      const title = `Startup ${startup}`;
      const startupOptions = startups.map(startup => {
        return {
          value: startup.id,
          label: startup.name
        }
      })
      return ({
        title,
        currentUserId: '',//req.auth.id,
        startupOptions,
        domain: config.domain,
        // request: req,
        activeTab: 'startups',
        isAdmin: false, //config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
        subActiveTab: 'list',
        // errors: req.flash('error'),
        // messages: req.flash('message'),
      });
    } catch (err) {
      console.error(err);
      throw new Error('Impossible de récupérer vos informations.');
    }
  }