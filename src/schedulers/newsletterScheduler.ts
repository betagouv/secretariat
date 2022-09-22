import crypto from 'crypto';
import HedgedocApi from 'hedgedoc-api';
import BetaGouv from '../betagouv';
import config from '@config';
import knex from '@/db';
import * as utils from '@controllers/utils';
import { getTitle, renderHtmlFromMdWithAttachements } from '@/lib/mdtohtml';
import { Member, MemberWithEmail } from '@models/member';
import { JobWTTJ } from '@models/job';
import { CommunicationEmailCode, DBUser } from '@models/dbUser';
import { sendInfoToChat } from '@/infra/chat';

const {
  NUMBER_OF_DAY_IN_A_WEEK,
  NUMBER_OF_DAY_FROM_MONDAY,
  addDays,
  getMonday,
} = utils;

const replaceMacroInContent = (newsletterTemplateContent, replaceConfig) => {
  const contentWithReplacement = Object.keys(replaceConfig).reduce(
    (previousValue, key) => previousValue.replace(key, replaceConfig[key]),
    newsletterTemplateContent
  );
  return contentWithReplacement;
};

const computeId = (dateAsString) => {
  const id = crypto
    .createHmac('sha256', config.newsletterHashSecret)
    .update(dateAsString)
    .digest('hex')
    .slice(0, 8);
  return id;
};

const createNewsletter = async () => {
  let date = getMonday(new Date()); // get first day of the current week
  date = addDays(date, NUMBER_OF_DAY_IN_A_WEEK); // get next monday (date + 7 days)
  const pad = new HedgedocApi(
    config.padEmail,
    config.padPassword,
    config.padURL
  );
  const newsletterName = `infolettre-${computeId(
    date.toISOString().split('T')[0]
  )}`;
  const replaceConfig = {
    __REMPLACER_PAR_LIEN_DU_PAD__: `${config.padURL}/${newsletterName}`,
    // next stand up is a week after the newsletter date on thursday
    __REMPLACER_PAR_DATE_STAND_UP__: utils.formatDateToFrenchTextReadableFormat(
      addDays(
        date,
        NUMBER_OF_DAY_IN_A_WEEK + NUMBER_OF_DAY_FROM_MONDAY.THURSDAY
      ),
    ),
    __REMPLACER_PAR_OFFRES__: await getJobOfferContent(),
    __REMPLACER_PAR_DATE__: utils.formatDateToFrenchTextReadableFormat(
      addDays(date, NUMBER_OF_DAY_FROM_MONDAY[config.newsletterSentDay])
    ),
  };

  // change content in template
  let newsletterTemplateContent = await pad.getNoteWithId(
    config.newsletterTemplateId
  );
  newsletterTemplateContent = replaceMacroInContent(
    newsletterTemplateContent,
    replaceConfig
  );

  const result = await pad.createNewNoteWithContentAndAlias(
    newsletterTemplateContent,
    newsletterName
  );
  const padUrl = result.request.res.responseUrl;
  const message = `Nouveau pad pour l'infolettre : ${padUrl}`;
  await knex('newsletters').insert({
    url: padUrl,
  });
  await sendInfoToChat({
    text: message
  })
  return padUrl;
};

const computeMessageReminder = (reminder, newsletter) => {
  let message;
  // curl -d "{\"text\":\"#Participez à la newsletter interne beta.gouv.fr ! ** :loudspeaker: : \n Bonjour, tout le monde ! Voici le pad de la semaine https://pad.incubateur.net/infolettre-2b2c25e4.\n Demande d'aide, de contribution, un événements, des annonces concernant une formation ? Ajouter les au pad de cette semaine ! \n Le pad sera envoyé jeudi, sous forme d'infolettre à la communauté ! \", \"channel\":\"communautexp\", \"username\":\"Florence Lebot (équipe Communauté beta.gouv.fr)\", \"icon_url\":\"https://upload.wikimedia.org/wikipedia/commons/2/27/Florence_Foresti_2011_2_%28cropped%29.jpg\"}" -H "Content-Type: application/json" -X POST https://mattermost.incubateur.net/hooks/m1ci6yau8jy788td4cmz9zo84r
  if (reminder === 'FIRST_REMINDER') {
    message = `### Participez à la newsletter interne beta.gouv.fr ! :loudspeaker: :
:wave:  Bonjour, tout le monde ! 

Voici le pad de la semaine ${newsletter.url} !

Ce que tu peux partager : 

- demandes d'aide ou de contribution
- des événements
- des formations
- des nouveautés transverses

Ajoute les au pad de cette semaine !

Le pad sera envoyé jeudi, sous forme d'infolettre à la communauté !`;
  } else if (reminder === 'SECOND_REMINDER') {
    message = `### Participez à la newsletter interne beta.gouv.fr ! :loudspeaker: :
:wave:  Bonjour, tout le monde ! 

Voici le pad de la semaine ${newsletter.url} !

Ce que tu peux partager : 

- demandes d'aide ou de contribution
- des événements
- des formations
- des nouveautés transverses

Ajoute les au pad de cette semaine !

Le pad sera envoyé à 16h, sous forme d'infolettre à la communauté !`;
  } else {
    message = `*:rolled_up_newspaper: La newsletter va bientôt partir !*
Vérifie une dernière fois le contenu du pad ${newsletter.url}. À 16 h, il sera envoyé à la communauté.`;
  }
  return message;
};

export async function newsletterReminder(reminder) {
  const currentNewsletter = await knex('newsletters')
    .where({
      sent_at: null,
    })
    .first();

  if (currentNewsletter) {
    await sendInfoToChat({
      text: computeMessageReminder(reminder, currentNewsletter),
      channel: 'general',
      extra: {
        username: 'Florence (équipe Communauté beta.gouv.fr)',
        icon_url: config.NEWSLETTER_BOT_ICON_URL
      }
    });
  }
}

export async function getJobOfferContent() {
  const monday = getMonday(new Date()); // get first day of the current week
  const jobs : JobWTTJ[] = await BetaGouv.getJobsWTTJ();
  const filteredJobs = jobs.filter(job => new Date(job.published_at) > monday)
  const content = filteredJobs.map(job => {
    return `[${job.name.trim()}](https://www.welcometothejungle.com/companies/communaute-beta-gouv/jobs/${job.slug})`
  }).join('\n')
  return content
}

export { createNewsletter };

export async function sendNewsletterAndCreateNewOne() {
  const date = new Date();
  const currentNewsletter = await knex('newsletters')
    .where({
      sent_at: null,
    })
    .first();

  if (currentNewsletter) {
    const pad = new HedgedocApi(
      config.padEmail,
      config.padPassword,
      config.padURL
    );
    const newsletterCurrentId = currentNewsletter.url.replace(
      `${config.padURL}/`,
      ''
    );
    const newsletterContent = await pad.getNoteWithId(newsletterCurrentId);
    const { html, attachments } = renderHtmlFromMdWithAttachements(newsletterContent);

    const usersInfos : Member[] = await BetaGouv.usersInfos();
    const users : Member[] = usersInfos.filter(userInfos => !utils.checkUserIsExpired(userInfos));
    const dbUsers : DBUser[] = await knex('users').whereNotNull('primary_email');
    const concernedUsers : MemberWithEmail[] = []
    for (const user of users) {
      const dbUser: DBUser | undefined = dbUsers.find((x) => x.username === user.id);
      if (dbUser ) {
        concernedUsers.push({
          ...user,
          email: dbUser.communication_email === CommunicationEmailCode.SECONDARY && dbUser.secondary_email ? dbUser.secondary_email : dbUser.primary_email
        })
      }
    }

    const usersEmails : string[] = concernedUsers.filter(user => user.email).map(user => user.email) as string[]
    await utils.sendMail(
      [...config.newsletterBroadcastList.split(','), ...usersEmails].join(','),
      `${getTitle(newsletterContent)}`,
      html,
      {
        headers: {
          'X-Mailjet-Campaign': newsletterCurrentId,
          'X-Mailjet-TrackOpen': '1',
          'X-Mailjet-TrackClick': '1',
        },
      },
      attachments
    );
    await knex('newsletters')
      .where({
        id: currentNewsletter.id,
      })
      .update({
        sent_at: date,
      });
    await createNewsletter();
  }
}
