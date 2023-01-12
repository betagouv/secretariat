import betagouv from "@/betagouv";
import config from "@config";
import { Startup } from "@models/startup";

export async function getStartupList(req, res) {
    try {
      const { startup } = req.params
      const startups: Startup[] = await betagouv.startupInfos()
      const title = `Startup ${startup}`;
      return res.render('startups', {
        title,
        currentUserId: req.auth.id,
        startups,
        domain: config.domain,
        activeTab: 'startups',
        subActiveTab: 'list',
        errors: req.flash('error'),
        messages: req.flash('message'),
      });
    } catch (err) {
      console.error(err);
      req.flash('error', 'Impossible de récupérer vos informations.');
      return res.redirect('/');
    }
  }