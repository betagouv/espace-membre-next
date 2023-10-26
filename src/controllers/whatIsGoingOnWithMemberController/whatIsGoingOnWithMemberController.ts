import betagouv from "../../betagouv";

export async function getWhatIsGoingOnWithMemberController(req, res) {

  try {
    const users = await betagouv.usersInfos();
    const title = 'Communauté';
    return {
        title,
        users,
        errors: req.flash('error'),
        messages: req.flash('message'),
        request: req,
    };
  } catch (err) {
    console.error(err);
    return res.send('Erreur interne : impossible de récupérer les informations de la communauté');
  }
}
