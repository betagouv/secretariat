import { StartupInfoCreatePage } from '@views';
import config from "@/config";

export async function getStartupInfoCreate(req, res) {
    try {
      const title = 'Changer une startup de phase';
      const formValidationErrors = {}
      res.send(
        StartupInfoCreatePage({
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
          errors: req.flash('error'),
          messages: req.flash('message'),
          request: req
        })
      )
    } catch (err) {
      console.error(err);
      req.flash('error', 'Impossible de récupérer les information de la startup.');
      return res.redirect('/');
    }
  }
  
