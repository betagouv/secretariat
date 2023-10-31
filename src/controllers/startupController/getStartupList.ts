import betagouv from '@/betagouv';
import { StartupListPage } from '@/views';
import config from '@config';
import { Startup } from '@models/startup';

export async function getStartupListApi(req, res) {
  getStartupListDataPage(
    req,
    res,
    (data) => {
      res.json({
        ...data,
      });
    },
    (err) => {
      res.status(500).json({
        error: err && err.message,
      });
    }
  );
}

export async function getStartupList(req, res) {
  getStartupListDataPage(
    req,
    res,
    (data) => {
      res.send(
        StartupListPage({
          errors: req.flash('error'),
          messages: req.flash('message'),
          request: req,
          ...data,
        })
      );
    },
    (err) => {
      console.error(err);
      req.flash('error', 'Impossible de récupérer vos informations.');
      return res.redirect('/');
    }
  );
}

async function getStartupListDataPage(req, res, onSuccess, onError) {
  try {
    const { startup } = req.params;
    const startups: Startup[] = await betagouv.startupInfos();
    const title = `Startup ${startup}`;
    const startupOptions = startups.map((startup) => {
      return {
        value: startup.id,
        label: startup.name,
      };
    });
    return onSuccess({
      title,
      currentUserId: req.auth.id,
      startupOptions,
      domain: config.domain,
      activeTab: 'startups',
      isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
      subActiveTab: 'list',
    });
  } catch (err) {
    onError(err);
  }
}
