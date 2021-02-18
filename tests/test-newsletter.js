const nock = require('nock');
const rewire = require('rewire');
const chai = require('chai');
const knex = require('../db');
const app = require('../index');
const controllerUtils = require('../controllers/utils');
const utils = require('./utils');

const newsletterController = rewire('../controllers/newsletterController.js');

const { createNewsletter } = require('../schedulers/newsletterScheduler');

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
            res.text.should.include(controllerUtils.formatDateToReadableDateAndTimeFormat(newsletter.sent_at));
          });
          const weekYear = mockNewsletters[MOST_RECENT_NEWSLETTER_INDEX].year_week.split('-');
          res.text.should.include(`<h3>Newsletter du ${controllerUtils.formatDateToFrenchTextReadableFormat(controllerUtils.getDateOfISOWeek(weekYear[1], weekYear[0]))}</h3>`);
          done();
        });
    });
  });

  describe('cronjob', () => {
    it('should create new note', async () => {
      const incubateurHead = nock('https://pad.incubateur.net').persist()
      .head(/.*/)
      .reply(200, {
        status: 'OK',
      }, {
        'set-cookie': '73dajkhs8934892jdshakldsja',
      });

      const incubateurPost1 = nock('https://pad.incubateur.net').persist()
      .post(/^.*login.*/)
      .reply(200, {}, {
        'set-cookie': '73dajkhs8934892jdshakldsja',
      });

      const incubateurGet = nock('https://pad.incubateur.net')
      .get(/^.*\/download/)
      .reply(200, '# TITLE ### TEXT CONTENT');

      const incubateurPost2 = nock('https://pad.incubateur.net')
      .post(/^.*new/)
      .reply(200, '# TITLE ### TEXT CONTENT');

      const res = await createNewsletter();
      incubateurHead.isDone().should.be.true;
      incubateurGet.isDone().should.be.true;
      incubateurPost1.isDone().should.be.true;
      incubateurPost2.isDone().should.be.true;
    });
  });
});
