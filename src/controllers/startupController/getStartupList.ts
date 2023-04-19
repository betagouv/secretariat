import betagouv from "@/betagouv";
import { StartupListPage } from "@/views";
import config from "@config";
import { Startup } from "@models/startup";

export async function getStartupList(req, res) {
    try {
      const { startup } = req.params
      const startups: Startup[] = await betagouv.startupInfos()
      const title = `Startup ${startup}`;
      const startupOptions = startups.map(startup => {
        return {
          value: startup.id,
          label: startup.name
        }
      })
      return res.send(StartupListPage({
        title,
        currentUserId: req.auth.id,
        startupOptions,
        domain: config.domain,
        request: req,
        activeTab: 'startups',
        isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
        subActiveTab: 'list',
        errors: req.flash('error'),
        messages: req.flash('message'),
      }));
    } catch (err) {
      console.error(err);
      req.flash('error', 'Impossible de récupérer vos informations.');
      return res.redirect('/');
    }
  }