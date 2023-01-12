import betagouv from "@/betagouv";
import config from "@config";
import { Member } from "@models/member";
import { Startup } from "@models/startup";

export async function getStartup(req, res) {
  try {
    const { startup } = req.params
    const startupInfos: Startup = await betagouv.startupInfosById(startup)
    const usersInfos: Member[] = await betagouv.usersInfos()
    const members = {}
    const memberTypes = ['expired_members', 'active_members', 'previous_members']
    memberTypes.forEach((memberType) => {
      members[memberType] = startupInfos[memberType].map(
        member => usersInfos.find(user => user.id === member))
    })
    const title = `Startup ${startup}`;
    return res.render('startup', {
      title,
      currentUserId: req.auth.id,
      startupInfos: startupInfos,
      members,
      domain: config.domain,
      activeTab: 'startups',
      errors: req.flash('error'),
      messages: req.flash('message'),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Impossible de récupérer vos informations.');
    return res.redirect('/');
  }
}