// import * as utils from "./utils";
import betagouv from "@/betagouv";

export async function getCommunity() {
  // if (req.query.username) {
  //   return res.redirect(`/community/${req.query.username}`);
  // }

  try {
    const users = await betagouv.usersInfos();
    const incubators = await betagouv.incubators()
    const startups = await betagouv.startupsInfos()
    const title = 'Communauté';
    return {
      title,
      currentUserId: '',
      incubatorOptions: Object.keys(incubators).map(incubator => {
        return {
          value: incubator,
          label: incubators[incubator].title 
        }
      }),
      startupOptions: startups.map(startup => {
        return {
          value: startup.id,
          label: startup.attributes.name
        }
      }),
      isAdmin: false, //config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
      domaineOptions: [{
          value: "ANIMATION",
          label: "Animation"
        }, {
          value: "COACHING",
          label: "Coaching"
        }, {
          value: "DEPLOIEMENT",
          label: "Déploiement"
        }, {
          value: "DESIGN",
          label: "Design"
        }, {
          value: "DEVELOPPEMENT",
          label: "Développement"
        }, {
          value: "INTRAPRENARIAT",
          label: "Intraprenariat"
        }, {
          value: "PRODUIT",
          label: "Produit"
        }, {
          value: "AUTRE",
          label: "Autre"
        }
      ],
      users,
      activeTab: 'community',
      // errors: req.flash('error'),
      // messages: req.flash('message'),
      // request: req
    }
  } catch (err) {
    console.error(err);
    throw new Error('Erreur interne : impossible de récupérer les informations de la communauté');
  }
}