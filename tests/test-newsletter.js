const nock = require('nock');
const rewire = require('rewire');
const chai = require('chai');
const sinon = require('sinon');

<<<<<<< HEAD
=======
const config = require('../config');
>>>>>>> 25aaa34009f41413e9ef081aeba129cba7271d99
const knex = require('../db');
const BetaGouv = require('../betagouv');
const app = require('../index');
const controllerUtils = require('../controllers/utils');
const utils = require('./utils');
<<<<<<< HEAD
const PAD = require('../lib/pad');
=======
>>>>>>> 25aaa34009f41413e9ef081aeba129cba7271d99
const {
  createNewsletter,
} = require('../schedulers/newsletterScheduler');

<<<<<<< HEAD
const NEWSLETTER_TEMPLATE_CONTENT = `# 📰 Infolettre interne de la communauté beta.gouv.fr du DATE
  Vous pouvez consulter cette infolettre [en ligne](NEWSLETTER_URL).
  [TOC]
  ## Nouvelles des startups
  ## Nouveautés transverses
  *Documentation : [Comment lancer ou participer à un sujet transverse](https://doc.incubateur.net/communaute/travailler-a-beta-gouv/actions-transverses)*
  ## Annonces de recrutements
  ## :calendar: Evénements à venir
  *Par ordre chronologique*
  ## Qui a écrit cette infolettre ? 
  Cette infolettre est collaborative. Elle a été écrite par les membres de la communauté dont vous faites partie.
  La prochaine sera envoyée jeudi prochain. Vous avez connaissance de news ou d'événements ? C'est à vous de jouer, vous pouvez commencer à l’écrire ici : [prochaine infolettre](NEXT_NEWSLETTER_URL)
  Vous avez raté l'infolettre précédente ? [Lire l'infolettre précédente](PREVIOUS_NEWSLETTER_URL)
`;

const newsletterScheduler = rewire('../schedulers/newsletterScheduler');
const replaceMacroInContent = newsletterScheduler.__get__('replaceMacroInContent');
=======
const newsletterScheduler = rewire('../schedulers/newsletterScheduler');
>>>>>>> 25aaa34009f41413e9ef081aeba129cba7271d99
const computeMessageReminder = newsletterScheduler.__get__('computeMessageReminder');
const newsletterReminder = newsletterScheduler.__get__('newsletterReminder');
const mockNewsletters = [
  {
    year_week: '2020-52',
    validator: 'julien.dauphant',
<<<<<<< HEAD
    url: 'https://pad.incubateur.com/45a5dsdsqsdada',
=======
    url: `${config.padURL}/45a5dsdsqsdada`,
>>>>>>> 25aaa34009f41413e9ef081aeba129cba7271d99
    sent_at: new Date(),
  },
  {
    year_week: '2021-02',
    validator: 'julien.dauphant',
<<<<<<< HEAD
    url: 'https://pad.incubateur.com/54564q5484saw',
=======
    url: `${config.padURL}/54564q5484saw`,
>>>>>>> 25aaa34009f41413e9ef081aeba129cba7271d99
    sent_at: new Date(),
  },
  {
    year_week: '2021-03',
    validator: 'julien.dauphant',
    url: `${config.padURL}/5456dsadsahjww`,
    sent_at: new Date(),
  },
  {
    year_week: '2020-51',
    validator: 'julien.dauphant',
    url: `${config.padURL}/54564qwsajsghd4rhjww`,
    sent_at: new Date(),
  },
];

const mockNewsletter = {
  year_week: '2021-9',
  url: `${config.padURL}/rewir34984292342sad`,
};
const MOST_RECENT_NEWSLETTER_INDEX = 2;
describe('Newsletter', () => {
  describe('should get newsletter data for newsletter page', () => {
    beforeEach(async () => {
      await knex('newsletters').insert(mockNewsletters);
    });
    afterEach(async () => {
      await knex('newsletters').truncate();
    });

    it('should get previous newsletter and last newsletter', (done) => {
      chai.request(app)
        .get('/newsletter')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include(`${config.padURL}/5456dsadsahjww`);
          const allNewsletterButMostRecentOne = mockNewsletters.filter(
            (n) => n.year_week !== mockNewsletters[MOST_RECENT_NEWSLETTER_INDEX].year_week,
          );
          allNewsletterButMostRecentOne.forEach((newsletter) => {
            res.text.should.include(controllerUtils
              .formatDateToReadableDateAndTimeFormat(newsletter.sent_at));
          });
          const weekYear = mockNewsletters[MOST_RECENT_NEWSLETTER_INDEX].year_week.split('-');
          res.text.should.include(`<h3>Newsletter du ${controllerUtils.formatDateToFrenchTextReadableFormat(controllerUtils.getDateOfISOWeek(weekYear[1], weekYear[0]))}</h3>`);
          done();
        });
    });
  });

  describe('cronjob newsletter', () => {
    beforeEach((done) => {
      this.slack = sinon.spy(BetaGouv, 'sendInfoToSlack');
      done();
    });

    afterEach((done) => {
      this.slack.restore();
      done();
    });

    it('should create new note', async () => {
<<<<<<< HEAD
      const createNewNoteWithContentAndAliasSpy = sinon.spy(PAD.prototype, 'createNewNoteWithContentAndAlias');
      await knex('newsletters')
      .where({ year_week: '2021-9'})
      .insert({
        ...mockNewsletter,
        sent_at: new Date('2021-03-01T07:59:59+01:00'),
        validator: 'julien.dauphant'
      });
      const date = new Date('2021-03-08T07:59:59+01:00');
      this.clock = sinon.useFakeTimers(date);

      const padHeadCall = nock('https://pad.incubateur.net').persist()
=======
      const padHeadCall = nock(`${config.padURL}`).persist()
>>>>>>> 25aaa34009f41413e9ef081aeba129cba7271d99
      .head(/.*/)
      .reply(200, {
        status: 'OK',
      }, {
        'set-cookie': '73dajkhs8934892jdshakldsja',
      });

      const padPostLoginCall = nock(`${config.padURL}`).persist()
      .post(/^.*login.*/)
      .reply(200, {}, {
        'set-cookie': '73dajkhs8934892jdshakldsja',
      });

      const padGetDownloadCall = nock(`${config.padURL}`)
      .get(/^.*\/download/)
      .reply(200, NEWSLETTER_TEMPLATE_CONTENT);

      const padPostNewCall = nock(`${config.padURL}`)
      .post(/^.*new/)
      .reply(301, undefined, {
        Location: `${config.padURL}/infolettre-08/03/2021`,
      })
      .get('/infolettre-08/03/2021')
      .reply(200, '');

      const res = await createNewsletter(); // await newsletterScheduler.__get__('createNewsletter')();
      padHeadCall.isDone().should.be.true;
      padGetDownloadCall.isDone().should.be.true;
      padPostLoginCall.isDone().should.be.true;
      padPostNewCall.isDone().should.be.true;
      createNewNoteWithContentAndAliasSpy.firstCall.args[0].should.equal(
        replaceMacroInContent(NEWSLETTER_TEMPLATE_CONTENT, {
          NEWSLETTER_URL: `${config.padURL}/infolettre-08/03/2021`,
          PREVIOUS_NEWSLETTER_URL: mockNewsletter.url,
          DATE: controllerUtils.formatDateToFrenchTextReadableFormat(date),
        }),
      );
      const newsletter = await knex('newsletters').orderBy('year_week').first();
      newsletter.url.should.equal(`${config.padURL}/infolettre-08/03/2021`);
      this.clock.restore();
      newsletter.year_week.should.equal(`${date.getFullYear()}-${controllerUtils.getWeekNumber(date)}`);
      await knex('newsletters').truncate();
    });

    it('should send remind on monday at 8am', async () => {
      await knex('newsletters').insert([mockNewsletter]);
      this.clock = sinon.useFakeTimers(new Date('2021-03-01T07:59:59+01:00'));
      await newsletterReminder('FIRST_REMINDER');
      this.slack.firstCall.args[0].should.equal(computeMessageReminder('FIRST_REMINDER', mockNewsletter));
      this.slack.restore();
      await knex('newsletters').truncate();
    });

    it('should send remind on thursday at 8am', async () => {
      await knex('newsletters').insert([mockNewsletter]);
      this.clock = sinon.useFakeTimers(new Date('2021-03-04T07:59:59+01:00'));
      await newsletterReminder('SECOND_REMINDER');
      this.slack.firstCall.args[0].should.equal(computeMessageReminder('SECOND_REMINDER', mockNewsletter));
      this.clock.restore();
      this.slack.restore();
      await knex('newsletters').truncate();
    });

    it('should send remind on thursday at 6pm', async () => {
      await knex('newsletters').insert([mockNewsletter]);
      this.clock = sinon.useFakeTimers(new Date('2021-03-04T17:59:59+01:00'));
      await newsletterReminder('THIRD_REMINDER');
      this.slack.firstCall.args[0].should.equal(computeMessageReminder('THIRD_REMINDER', mockNewsletter));
      this.clock.restore();
      this.slack.restore();
      await knex('newsletters').truncate();
    });

    it('should send remind on friday at 8am', async () => {
      this.clock = sinon.useFakeTimers(new Date('2021-03-05T07:59:59+01:00'));
      await newsletterReminder('THIRD_REMINDER');
      this.slack.notCalled.should.be.true;
      this.clock.restore();
      this.slack.restore();
    });
  });
});
