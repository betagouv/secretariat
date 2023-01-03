import betagouv from "../../betagouv";
import { WhatIsGoingOnWithMemberPage } from "@/views";

export async function getWhatIsGoingOnWithMemberController(req, res) {

  try {
    const users = await betagouv.usersInfos();
    const startups = await betagouv.startupsInfos()
    const title = 'Communauté';
    return res.send(WhatIsGoingOnWithMemberPage({
        title,
        startupOptions: startups.map(startup => {
            return {
                value: startup.id,
                label: startup.attributes.name
            };
        }),
        users,
        errors: req.flash('error'),
        messages: req.flash('message'),
        request: req,
        formData: undefined,
        userInfos: undefined,
        userConfig: {
            statusOptions: [],
            minStartDate: "",
            badgeOptions: [],
            memberOptions: []
        }
    }));
  } catch (err) {
    console.log('ERROR : GET QUE CE PASSE_TIL')
    console.error(err);
    return res.send('Erreur interne : impossible de récupérer les informations de la communauté');
  }
}
