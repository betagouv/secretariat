import chai from 'chai';
import chaiHttp from 'chai-http';
import HedgedocApi from 'hedgedoc-api';
import nock from 'nock';
import rewire from 'rewire';
import sinon from 'sinon';
import BetaGouv from '@/betagouv';
import config from '@config';
import * as controllerUtils from '@controllers/utils';
import knex from '@/db';
import app from '@/index';
import { renderHtmlFromMd } from '@/lib/mdtohtml';
import { createNewsletter, getJobOfferContent } from '@schedulers/newsletterScheduler';
import utils from './utils';
import * as chat from '@/infra/chat';
import * as Email from '@/config/email.config';
chai.use(chaiHttp);

const should = chai.should();

const {
  NUMBER_OF_DAY_IN_A_WEEK,
  NUMBER_OF_DAY_FROM_MONDAY,
  addDays,
  getMonday,
  formatDateToFrenchTextReadableFormat,
} = controllerUtils;

const NEWSLETTER_TITLE =
  '📰 A ne pas rater chez beta.gouv.fr ! - Infolettre du __REMPLACER_PAR_DATE__';
const NEWSLETTER_TEMPLATE_CONTENT = `# ${NEWSLETTER_TITLE}
  Vous pouvez consulter cette infolettre [en ligne](__REMPLACER_PAR_LIEN_DU_PAD__).
  ### Modèle d'annonce d'une Startup (Présenté par Jeanne Doe)
  ## Nouveautés transverses
  *Documentation : [Comment lancer ou participer à un sujet transverse](https://doc.incubateur.net/communaute/travailler-a-beta-gouv/actions-transverses)*
  ## Annonces des recrutements
  __REMPLACER_PAR_OFFRES__
  ## :calendar: Evénements à venir
  ### 👋 Prochain point hebdo beta.gouv, jeudi __REMPLACER_PAR_DATE_STAND_UP__ à 12h
`;

const newsletterScheduler = rewire('../src/schedulers/newsletterScheduler');
const replaceMacroInContent = newsletterScheduler.__get__(
  'replaceMacroInContent'
);
const computeMessageReminder = newsletterScheduler.__get__(
  'computeMessageReminder'
);
const newsletterReminder = newsletterScheduler.__get__('newsletterReminder');
const sendNewsletterAndCreateNewOne = newsletterScheduler.__get__(
  'sendNewsletterAndCreateNewOne'
);
const computeId = newsletterScheduler.__get__('computeId');

const mockNewsletters = [
  {
    validator: 'julien.dauphant',
    url: `${config.padURL}/45a5dsdsqsdada`,
    sent_at: new Date('2021-02-11 00:00:00+00'),
    created_at: new Date('2021-02-11 00:00:00+00'),
    id: utils.randomUuid(),
  },
  {
    validator: 'julien.dauphant',
    url: `${config.padURL}/54564q5484saw`,
    sent_at: new Date('2021-02-18 00:00:00+00'),
    created_at: new Date('2021-02-18 00:00:00+00'),
    id: utils.randomUuid(),
  },
  {
    validator: 'julien.dauphant',
    url: `${config.padURL}/5456dsadsahjww`,
    sent_at: new Date('2021-02-25 00:00:00+00'),
    created_at: new Date('2021-02-25 00:00:00+00'),
    id: utils.randomUuid(),
  },
  {
    validator: 'julien.dauphant',
    url: `${config.padURL}/54564qwsajsghd4rhjww`,
    sent_at: new Date('2021-03-04 00:00:00+00'),
    created_at: new Date('2021-03-04 00:00:00+00'),
    id: utils.randomUuid(),
  },
];

const mockNewsletter = {
  url: `${config.padURL}/rewir34984292342sad`,
  created_at: new Date('2021-04-04 00:00:00+00'),
  id: utils.randomUuid(),
};

describe('Newsletter', () => {
  let clock;

  describe('should get newsletter data for newsletter page', () => {
    beforeEach(async () => {
      await knex('newsletters').insert([...mockNewsletters, mockNewsletter]);
    });
    afterEach(async () => {
      await knex('newsletters').truncate();
    });

    it('should get previous newsletters and current newsletter', (done) => {
      const date = new Date('2021-01-20T07:59:59+01:00');
      clock = sinon.useFakeTimers(date);
      chai
        .request(app)
        .get('/newsletters')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include(`${config.padURL}/5456dsadsahjww`);
          const allNewsletterButMostRecentOne = mockNewsletters.filter(
            (n) => !n.sent_at
          );
          allNewsletterButMostRecentOne.forEach((newsletter) => {
            res.text.should.include(
              controllerUtils.formatDateToReadableDateAndTimeFormat(
                newsletter.sent_at
              )
            );
          });
          const currentNewsletter = mockNewsletter;
          res.text.should.include(
            `<h3>Infolettre de la semaine du ${controllerUtils.formatDateToFrenchTextReadableFormat(
              addDays(getMonday(currentNewsletter.created_at), 7)
            )}</h3>`
          );
          clock.restore();
          done();
        });
    });
  });

  describe('cronjob newsletter', () => {
    let slack;
    let jobsStub;
    beforeEach((done) => {
      slack = sinon.spy(chat, 'sendInfoToChat');
      jobsStub = sinon
      .stub(BetaGouv, 'getJobsWTTJ').returns(Promise.resolve(
        [{
          "id": 807837,
          "reference": "LCB_979pJ9D",
          "name": "Dev Ruby on Rails expérimenté·e",
          "slug": "dev-ruby-on-rails-experimente-e_cenac",
          "description": "<p>L’équipe <a href=\"https://beta.gouv.fr/startups/lapins.html\" target=\"_blank\">RDV-Solidarités</a> recherche <strong>un·e dev Ruby on Rails expérimenté·e (3 ans d'expérience)</strong> pour accélérer l’utilisation de la plateforme dans le cadre de la prise de RDV dans le champ de l’insertion et du RSA.</p>\n\n<p>Lancé en 2019 suite à une expérimentation dans le Pas-de-Calais, le service RDV-Solidarités s’est construit avec un consortium d’une dizaine de départements, principalement pour gérer les RDV du champ médico-social.</p>\n\n<p>Aujourd’hui, plus de 10 000 RDV sont pris hebdomadairement sur la plateforme, et le service s’ouvre à d’autres usages : conseillers numériques France Service, RSA et insertion, etc.</p>\n\n<p><strong>Responsabilités</strong></p>\n\n<p>Dans le cadre de ce recrutement, tu feras le lien avec l’équipe RDV-Insertion (<a href=\"http://www.rdv-insertion.fr\" target=\"_blank\">www.rdv-insertion.fr</a>), un service lié à RDV-Solidarités, en charge d’améliorer les parcours des bénéficiaires RSA. Tu auras donc en charge de comprendre et construire les features nécessaires aux usages spécifiques de l’insertion.</p>\n\n<p>Exemple de features déjà identifiées : </p>\n\n<ul>\n<li>développement des RDV collectifs dans le cadre des RDV du RSA</li>\n<li>développement d'API pour appeler appeler RDV-Solidarités et RDV-Insertion depuis des sites externes</li>\n<li>amélioration de l'interface utilisateur</li>\n<li>...</li>\n</ul>\n\n<p>Pour comprendre les roadmaps et comment les équipes de dev fonctionnent, n’hésite pas à parcourir les pages github de RDV-Solidarités (github.com/betagouv/rdv-solidarites.fret) et RDV-Insertion (github.com/betagouv/rdv-insertion) !</p>\n\n<p><strong>Stack</strong></p>\n\n<ul>\n<li>Technos : Ruby on Rails, bases de front-end (html / css / javascript)</li>\n<li>Code ouvert et libre</li>\n<li>Bonnes pratiques : le code est testé, revu, est déployé par petits lots </li>\n</ul>\n",
          "published_at": "2022-07-05T12:23:43.029+02:00",
          "profile": "<ul>\n<li>Tu as la volonté d'améliorer le service public</li>\n<li>Tu es autonome dans la conception, l'écriture et le déploiement de ton code, et en maîtrises les bonnes pratiques </li>\n<li>Tu sais faire preuve d'initiative et tenir tes engagement</li>\n<li>Tu es curieuse ou curieux, et capable d'interagir avec des équipes variées (incubateur des territoires, conseils départementaux, conseillers numériques)</li>\n<li>Tu aimes travailler dans une petite équipe et de manière agile</li>\n<li>Tu es à l'écoute et à l'aise dans la communication orale et écrite, avec tes collègues et en public</li>\n</ul>\n",
          "recruitment_process": "<p>Le process de recrutement est de deux entretiens (techniques et produit), avant un <strong>démarrage souhaité dès que possible</strong>. </p>\n\n<p>Le poste ouvert pour une indépendante ou un indépendant pour un <strong>premier contrat de 3 mois renouvelable</strong>, à temps plein (3/5 ou 4/5 par semaine négociable selon le profil).</p>\n\n<p>Le télétravail est possible, et une présence ponctuelle à Paris est demandée pour participer aux sessions stratégiques et collaboratives.</p>\n\n<p>Enfin, le TJM est à définir et selon expérience, dans une fourchette entre 500 et 600 euros / jours.</p>\n",
          }],
      ));
      done();
    });

    afterEach((done) => {
      jobsStub.restore()
      slack.restore();
      done();
    });

    it('should create new note', async () => {
      const createNewNoteWithContentAndAliasSpy = sinon.spy(
        HedgedocApi.prototype,
        'createNewNoteWithContentAndAlias'
      );
      const date = new Date('2021-03-04T07:59:59+01:00');
      const newsletterDate = addDays(getMonday(date), 14);
      clock = sinon.useFakeTimers(date);
      const newsletterName = `infolettre-${computeId(
        newsletterDate.toISOString().split('T')[0]
      )}`;
      const padHeadCall = nock(`${config.padURL}`).persist().head(/.*/).reply(
        200,
        {
          status: 'OK',
        },
        {
          'set-cookie': '73dajkhs8934892jdshakldsja',
        }
      );

      const padPostLoginCall = nock(`${config.padURL}`)
        .persist()
        .post(/^.*login.*/)
        .reply(
          200,
          {},
          {
            'set-cookie': '73dajkhs8934892jdshakldsja',
          }
        );

      const padGetDownloadCall = nock(`${config.padURL}`)
        .get(/^.*\/download/)
        .reply(200, NEWSLETTER_TEMPLATE_CONTENT);

      const padPostNewCall = nock(`${config.padURL}`)
        .post(/^.*new/)
        .reply(301, undefined, {
          Location: `${config.padURL}/${newsletterName}`,
        })
        .get(`/${newsletterName}`)
        .reply(200, '');

      await createNewsletter();
      padHeadCall.isDone().should.be.true;
      padGetDownloadCall.isDone().should.be.true;
      padPostLoginCall.isDone().should.be.true;
      padPostNewCall.isDone().should.be.true;
      createNewNoteWithContentAndAliasSpy.firstCall.args[0].should.equal(
        replaceMacroInContent(NEWSLETTER_TEMPLATE_CONTENT, {
          __REMPLACER_PAR_LIEN_DU_PAD__: `${config.padURL}/${newsletterName}`,
          __REMPLACER_PAR_DATE_STAND_UP__: formatDateToFrenchTextReadableFormat(
            addDays(
              getMonday(newsletterDate),
              NUMBER_OF_DAY_IN_A_WEEK + NUMBER_OF_DAY_FROM_MONDAY.THURSDAY
            )
          ),
          __REMPLACER_PAR_OFFRES__: await getJobOfferContent(),
          __REMPLACER_PAR_DATE__:
            controllerUtils.formatDateToFrenchTextReadableFormat(
              addDays(date, NUMBER_OF_DAY_IN_A_WEEK*2)
            ),
        })
      );
      const newsletter = await knex('newsletters')
        .orderBy('created_at')
        .first();
      newsletter.url.should.equal(`${config.padURL}/${newsletterName}`);
      clock.restore();
      await knex('newsletters').truncate();
    });

    it('should send remind on monday at 8am', async () => {
      await knex('newsletters').insert([mockNewsletter]);
      clock = sinon.useFakeTimers(new Date('2021-03-01T07:59:59+01:00'));
      await newsletterReminder('FIRST_REMINDER');
      slack.firstCall.args[0].text.should.equal(
        computeMessageReminder('FIRST_REMINDER', mockNewsletter)
      );
      clock.restore();
      slack.restore();
      await knex('newsletters').truncate();
    });

    it('should send remind on thursday at 8am', async () => {
      await knex('newsletters').insert([mockNewsletter]);
      clock = sinon.useFakeTimers(new Date('2021-03-04T07:59:59+01:00'));
      await newsletterReminder('SECOND_REMINDER');
      slack.firstCall.args[0].text.should.equal(
        computeMessageReminder('SECOND_REMINDER', mockNewsletter)
      );
      clock.restore();
      slack.restore();
      await knex('newsletters').truncate();
    });

    it('should send remind on thursday at 6pm', async () => {
      await knex('newsletters').insert([mockNewsletter]);
      clock = sinon.useFakeTimers(new Date('2021-03-04T17:59:59+01:00'));
      await newsletterReminder('THIRD_REMINDER');
      slack.firstCall.args[0].text.should.equal(
        computeMessageReminder('THIRD_REMINDER', mockNewsletter)
      );
      clock.restore();
      slack.restore();
      await knex('newsletters').truncate();
    });

    it('should send remind on friday at 8am', async () => {
      clock = sinon.useFakeTimers(new Date('2021-03-05T07:59:59+01:00'));
      await newsletterReminder('THIRD_REMINDER');
      slack.notCalled.should.be.true;
      clock.restore();
      slack.restore();
    });

    it('should send newsletter if validated', async () => {
      const date = new Date('2021-03-05T07:59:59+01:00');
      const dateAsString = controllerUtils.formatDateToFrenchTextReadableFormat(
        addDays(date, NUMBER_OF_DAY_IN_A_WEEK)
      );
      const contentWithMacro = replaceMacroInContent(
        NEWSLETTER_TEMPLATE_CONTENT,
        {
          __REMPLACER_PAR_LIEN_DU_PAD__: `${config.padURL}/jfkdsfljkslfsfs`,
          __REMPLACER_PAR_DATE_STAND_UP__: formatDateToFrenchTextReadableFormat(
            addDays(
              getMonday(date),
              NUMBER_OF_DAY_IN_A_WEEK + NUMBER_OF_DAY_FROM_MONDAY.THURSDAY
            )
          ),
          __REMPLACER_PAR_DATE__: dateAsString,
        }
      );
      utils.cleanMocks();
      utils.mockUsers();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      utils.mockOvhUserResponder();
      utils.mockOvhUserEmailInfos();
      const padHeadCall = nock(`${config.padURL}`).persist().head(/.*/).reply(
        200,
        {
          status: 'OK',
        },
        {
          'set-cookie': '73dajkhs8934892jdshakldsja',
        }
      );

      const padPostLoginCall = nock(`${config.padURL}`)
        .persist()
        .post(/^.*login.*/)
        .reply(
          200,
          {},
          {
            'set-cookie': '73dajkhs8934892jdshakldsja',
          }
        );

      const padGetDownloadCall = nock(`${config.padURL}`)
        .get(/^.*\/download/)
        .reply(200, contentWithMacro)
        .persist();

      const padPostNewCall = nock(`${config.padURL}`)
        .post(/^.*new/)
        .reply(200, '');

      await knex('newsletters').insert([
        {
          ...mockNewsletter,
          validator: 'julien.dauphant',
          sent_at: null,
        },
      ]);
      clock = sinon.useFakeTimers(date);
      await sendNewsletterAndCreateNewOne();
      padHeadCall.isDone().should.be.true;
      padGetDownloadCall.isDone().should.be.true;
      padPostLoginCall.isDone().should.be.true;
      padPostNewCall.isDone().should.be.true;
      slack.called.should.be.true;
      const newsletter = await knex('newsletters')
        .orderBy('created_at')
        .whereNotNull('sent_at')
        .first();
      newsletter.sent_at.should.not.be.null;
      clock.restore();
      slack.restore();
      await knex('newsletters').truncate();
    });
  });

  describe('newsletter interface', () => {
    it('should validate newsletter', async () => {
      await knex('newsletters').insert([
        {
          ...mockNewsletter,
        },
      ]);
      const date = new Date('2021-03-05T07:59:59+01:00');
      clock = sinon.useFakeTimers(date);
      await chai
        .request(app)
        .get('/validateNewsletter')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`);
      const newsletter = await knex('newsletters')
        .where({ id: mockNewsletter.id })
        .first();
      newsletter.validator.should.equal('membre.actif');
      await knex('newsletters').truncate();
      clock.restore();
    });

    it('should cancel newsletter', async () => {
      await knex('newsletters').insert([
        {
          ...mockNewsletter,
          validator: 'membre.actif',
        },
      ]);
      const date = new Date('2021-03-05T07:59:59+01:00');
      clock = sinon.useFakeTimers(date);
      await chai
        .request(app)
        .get('/cancelNewsletter')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`);
      const newsletter = await knex('newsletters')
        .where({ id: mockNewsletter.id })
        .first();
      should.equal(newsletter.validator, null);
      await knex('newsletters').truncate();
      clock.restore();
    });
  });
});
