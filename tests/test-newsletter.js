const nock = require('nock');
const rewire = require('rewire');
const chai = require('chai');
const sinon = require('sinon');

const knex = require('../db');
const BetaGouv = require('../betagouv');
const app = require('../index');
const controllerUtils = require('../controllers/utils');
const utils = require('./utils');
const PAD = require('../lib/pad');
const {
  createNewsletter,
} = require('../schedulers/newsletterScheduler');

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
const computeMessageReminder = newsletterScheduler.__get__('computeMessageReminder');
const newsletterReminder = newsletterScheduler.__get__('newsletterReminder');
const mockNewsletters = [
  {
    year_week: '2020-52',
    validator: 'julien.dauphant',
    url: 'https://pad.incubateur.com/45a5dsdsqsdada',
    sent_at: new Date(),
  },
  {
    year_week: '2021-02',
    validator: 'julien.dauphant',
    url: 'https://pad.incubateur.com/54564q5484saw',
    sent_at: new Date(),
  },
  {
    year_week: '2021-03',
    validator: 'julien.dauphant',
    url: 'https://pad.incubateur.com/5456dsadsahjww',
    sent_at: new Date(),
  },
  {
    year_week: '2020-51',
    validator: 'julien.dauphant',
    url: 'https://pad.incubateur.com/54564qwsajsghd4rhjww',
    sent_at: new Date(),
  },
];

const mockNewsletter = {
  year_week: '2021-9',
  url: 'https://pad.incubateur.net/rewir34984292342sad',
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
          res.text.should.include('https://pad.incubateur.com/5456dsadsahjww');
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
      const createNewNoteWithContentSpy = sinon.spy(PAD.prototype, 'createNewNoteWithContent');
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
      .head(/.*/)
      .reply(200, {
        status: 'OK',
      }, {
        'set-cookie': '73dajkhs8934892jdshakldsja',
      });

      const padPostLoginCall = nock('https://pad.incubateur.net').persist()
      .post(/^.*login.*/)
      .reply(200, {}, {
        'set-cookie': '73dajkhs8934892jdshakldsja',
      });

      const padGetDownloadCall = nock('https://pad.incubateur.net')
      .get(/^.*\/download/)
      .reply(200, NEWSLETTER_TEMPLATE_CONTENT);

      const padPostNewCall = nock('https://pad.incubateur.net')
      .post(/^.*new/)
      .reply(301, undefined, {
        Location: 'https://pad.incubateur.net/i3472ndasda4545',
      })
      .get('/i3472ndasda4545')
      .reply(200, '');

      const res = await createNewsletter(); // await newsletterScheduler.__get__('createNewsletter')();
      padHeadCall.isDone().should.be.true;
      padGetDownloadCall.isDone().should.be.true;
      padPostLoginCall.isDone().should.be.true;
      padPostNewCall.isDone().should.be.true;
      createNewNoteWithContentSpy.firstCall.args[0].should.equal(
        replaceMacroInContent(NEWSLETTER_TEMPLATE_CONTENT, {
          NEWSLETTER_URL: 'https://pad.incubateur.net/i3472ndasda4545',
          PREVIOUS_NEWSLETTER_URL: mockNewsletter.url,
          DATE: controllerUtils.formatDateToFrenchTextReadableFormat(date),
        }),
      );
      const newsletter = await knex('newsletters').select();
      newsletter[0].url.should.equal('https://pad.incubateur.net/i3472ndasda4545');
      this.clock.restore();
      newsletter[0].year_week.should.equal(`${date.getFullYear()}-${controllerUtils.getWeekNumber(date)}`);
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
