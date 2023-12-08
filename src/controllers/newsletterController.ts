import config from '@config';
import * as utils from './utils';
import knex from '../db';

const errorMessage = 'Impossible de récupérer les infolettres.';

const formatNewsletterPageData = (req, newsletters, currentNewsletter) => ({
  errors: req.flash('error'),
  messages: req.flash('message'),
  userConfig: config.user,
  domain: config.domain,
  currentUserId: req.auth.id,
  currentNewsletter,
  newsletters,
  isAdmin: config.ESPACE_MEMBRE_ADMIN.includes(req.auth.id),
  activeTab: 'newsletter',
});

const updateCurrentNewsletterValidator = async (validator) => {
  let lastNewsletter = await knex('newsletters')
    .orderBy('created_at', 'desc')
    .first();
  if (lastNewsletter && !lastNewsletter.sent_at) {
    lastNewsletter = await knex('newsletters')
      .where({
        id: lastNewsletter.id,
      })
      .update({
        validator,
      })
      .returning('*');
  }
  return lastNewsletter;
};

const formatNewsletter = (newsletter) => ({
  ...newsletter,
  title: newsletter.sent_at
    ? utils.formatDateToFrenchTextReadableFormat(newsletter.sent_at)
    : utils.formatDateToFrenchTextReadableFormat(
        utils.addDays(utils.getMonday(newsletter.created_at), 7)
      ), // get next monday (date + 7 days),
  sent_at: newsletter.sent_at
    ? utils.formatDateToReadableDateAndTimeFormat(newsletter.sent_at)
    : undefined,
});

export async function getNewsletterPage(req, res) {
  getNewsletter(
    req,
    res,
    (data) => {
      res.render('newsletter', {
        ...data,
      });
    },
    (data) => {
      res.render('newsletter', {
        ...data,
      });
    }
  );
}

export async function getNewsletterApi(req, res) {
  getNewsletter(
    req,
    res,
    (data) => {
      res.json({
        ...data,
      });
    },
    (data) => {
      res.status(500).json({
        message: req.flash('error'),
      });
    }
  );
}

export async function getNewsletter(req, res, onSuccess, onError) {
  try {
    let newsletters = await knex('newsletters')
      .select()
      .orderBy('created_at', 'desc');
    newsletters = newsletters.map((newsletter) => formatNewsletter(newsletter));
    const currentNewsletter = newsletters.shift();
    onSuccess(formatNewsletterPageData(req, newsletters, currentNewsletter));
  } catch (err) {
    console.error(err);
    req.flash('error', errorMessage);
    onError(formatNewsletterPageData(req, [], null));
  }
}

export async function validateNewsletter(req, res) {
  try {
    const currentNewsletter = await updateCurrentNewsletterValidator(
      req.auth.id
    );
    if (!currentNewsletter) {
      throw new Error("Il n'y a pas d'infolettre pour cette semaine");
    }

    req.flash('message', "L'infolettre a été validée et sera envoyée ce soir.");
    res.redirect('/newsletters');
  } catch (err) {
    console.error(err);
    req.flash('error', errorMessage);
    res.redirect('/newsletters');
  }
}

export async function cancelNewsletter(req, res) {
  try {
    const currentNewsletter = await updateCurrentNewsletterValidator(null);
    if (!currentNewsletter) {
      throw new Error("Il n'y a pas d'infolettre pour cette semaine");
    }

    req.flash('message', "L'envoie automatique de l'infolettre a été annulé.");
    res.redirect('/newsletters');
  } catch (err) {
    console.error(err);
    req.flash('error', errorMessage);
    res.redirect('/newsletters');
  }
}
