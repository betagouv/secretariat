import { StartupInfoCreatePage } from '@views';
import config from '@/config';

export async function getStartupInfoCreate(req, res) {
  getStartupInfoCreatePageData(
    req,
    res,
    (data) => {
      res.send(
        StartupInfoCreatePage({
          ...data,
          errors: req.flash('error'),
          messages: req.flash('message'),
          request: req,
        })
      );
    },
    (err) => {
      console.error(err);
      req.flash(
        'error',
        'Impossible de récupérer les information de la startup.'
      );
      return res.redirect('/');
    }
  );
}

export async function getStartupInfoCreateApi(req, res) {
  getStartupInfoCreatePageData(
    req,
    res,
    (data) => {
      res.json({
        ...data,
      });
    },
    (err) => {
      res.status(500).json({
        error: 'Impossible de récupérer les information de la startup.',
      });
    }
  );
}

async function getStartupInfoCreatePageData(req, res, onSuccess, onError) {
  try {
    const title = 'Changer une startup de phase';
    const formValidationErrors = {};
    onSuccess({
      title,
      formValidationErrors,
      currentUserId: req.auth.id,
      isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
      activeTab: 'startups',
      subActiveTab: 'create',
      username: req.auth.id,
      formData: {
        // link: '',
        // dashlord_url: '',
        // repository: '',
        // mission: ''
        // stats_url: '',
        // incubator:
        // sponsors: startup.attributes.sponsors
      },
    });
  } catch (err) {
    onError(err);
  }
}
