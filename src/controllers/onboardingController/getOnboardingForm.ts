import BetaGouv from "@/betagouv";
import { genderOptions, statusOptions } from '@/models/dbUser/dbUser';
import { OnboardingPage } from '@/views';
import { DOMAINE_OPTIONS, Member } from '@models/member';
import config from "@/config";

export async function getForm(req, res) {
    try {
      const title = 'Mon compte';
      const formValidationErrors = {}
      const startups = await BetaGouv.startupsInfos();
      const users : Member[] = await BetaGouv.getActiveUsers();
      const startupOptions = startups.map(startup => {
        return {
          value: startup.id,
          label: startup.attributes.name
        }
      })
      res.send(
        OnboardingPage({
          title,
          formValidationErrors,
          startups,
          genderOptions,
          statusOptions,
          startupOptions,
          domaineOptions: DOMAINE_OPTIONS,
          userConfig: config.user,
          users,
          formData: {
            gender: '',
            legal_status: '',
            workplace_insee_code: '',
            tjm: 0,
            secondary_email: '',
            osm_city: '',
            average_nb_of_days: 0,
            communication_email: 'secondary',
            should_create_marrainage: false
          },
          communeInfo: null,
          errors: req.flash('error'),
          messages: req.flash('message'),
          request: req
        })
      )
    } catch (err) {
      console.error(err);
      req.flash('error', 'Impossible de récupérer vos informations.');
      return res.redirect('/');
    }
  }
  