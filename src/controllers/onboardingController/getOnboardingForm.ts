import BetaGouv from '@/betagouv';
import { genderOptions, statusOptions } from '@/models/dbUser/dbUser';
import { OnboardingPage } from '@/views';
import { DOMAINE_OPTIONS, Member } from '@models/member';
import config from '@/config';

export async function getForm(req, res) {
  getOnboardingPageData(
    req,
    res,
    (data) => {
      res.send(
        OnboardingPage({
          ...data,
          errors: req.flash('error'),
          messages: req.flash('message'),
          request: req,
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

export async function getFormApi(req, res) {
  getOnboardingPageData(
    req,
    res,
    (data) => {
      res.json({
        ...data,
      });
    },
    (err) => {
      res.status(500).json({
        error: 'Impossible de récupérer vos informations.',
      });
    }
  );
}

export async function getOnboardingPageData(req, res, onSuccess, onError) {
  try {
    const title = 'Mon compte';
    const formValidationErrors = {};
    const startups = await BetaGouv.startupsInfos();
    const users: Member[] = await BetaGouv.getActiveUsers();
    const allUsers: Member[] = await BetaGouv.usersInfos();
    const startupOptions = startups.map((startup) => {
      return {
        value: startup.id,
        label: startup.attributes.name,
      };
    });
    onSuccess({
      title,
      formValidationErrors,
      startups,
      genderOptions,
      statusOptions,
      startupOptions,
      domaineOptions: DOMAINE_OPTIONS,
      userConfig: config.user,
      users,
      allUsers,
      formData: {
        gender: '',
        legal_status: '',
        workplace_insee_code: '',
        tjm: 0,
        secondary_email: '',
        osm_city: '',
        average_nb_of_days: 0,
        communication_email: 'secondary',
        should_create_marrainage: false,
        memberType: 'beta',
      },
      communeInfo: null,
    });
  } catch (err) {
    onError(err);
  }
}
