import nock from 'nock';
import chai from 'chai';
import sinon from 'sinon';
import BetaGouv from '@/betagouv';
import config from '@config';
import utils from './utils';
import * as email from '@config/email.config';
import knex from '@/db';
import {
  sendInfoToSecondaryEmailAfterXDays,
  deleteSecondaryEmailsForUsers,
  deleteOVHEmailAcounts,
  removeEmailsFromMailingList,
  deleteRedirectionsAfterQuitting,
} from '@schedulers/userContractEndingScheduler';
import { EmailStatusCode } from '@/models/dbUser/dbUser';
import { setEmailExpired } from '@schedulers/setEmailExpired';
import betagouv from '@/betagouv';
import { Domaine } from '@models/member';

const should = chai.should();
const fakeDate = '2020-01-01T09:59:59+01:00';
const fakeDateLess1day = '2019-12-31';
const fakeDateMore15days = '2020-01-16';
const fakeDateMore30days = '2020-01-31';
const fakeDateLess30days = '2019-12-02'

const betaGouvUsers = [
  {
    id: 'membre.actif',
    fullname: 'Membre Actif',
    missions: [
      {
        start: '2016-11-03',
        status: 'independent',
        employer: 'octo',
      },
    ],
  },
  {
    id: 'membre.expire',
    fullname: 'Membre Expiré',
    missions: [
      {
        start: '2016-11-03',
        end: '2017-11-02',
        status: 'independent',
        employer: 'octo',
      },
    ],
  },
  {
    id: 'membre.quipart',
    fullname: 'membre quipart',
    github: 'test-github',
    missions: [
      {
        start: '2016-11-03',
        end: fakeDateMore15days,
        status: 'independent',
        employer: 'octo',
      },
    ],
  },
  {
    id: 'membre.quipart',
    fullname: 'membre quipart',
    github: 'test-github',
    domaine: 'Développement',
    missions: [
      {
        start: '2016-11-03',
        end: fakeDateMore30days,
        status: 'independent',
        employer: 'octo',
      },
    ],
  },
];

const mattermostUsers = [
  {
    id: 'membre.actif',
    email: `membre.actif@${config.domain}`,
    username: 'membreactif',
  },
  {
    id: 'julien.dauphant',
    email: `julien.dauphant@${config.domain}`,
    username: 'julien.dauphant',
  },
  {
    id: 'membre.quipart',
    email: `membre.quipart@modernisation.gouv.fr`,
    username: 'membre.quipart',
  },
  {
    id: 'countdoesnotexist',
    email: `countdoesnotexist@${config.domain}`,
  },
];

const userContractEndingScheduler = require('@schedulers/userContractEndingScheduler');

describe('send message on contract end to user', () => {
  let chat;
  let clock;
  let sendEmailStub;
  let jobsStub
  beforeEach(async () => {
    utils.cleanMocks();
    utils.mockSlackGeneral();
    utils.mockSlackSecretariat();
    utils.mockOvhTime();
    utils.mockOvhRedirections();
    utils.mockOvhUserResponder();
    utils.mockOvhUserEmailInfos();
    utils.mockOvhAllEmailInfos();
    sendEmailStub = sinon
      .stub(email, 'sendEmail')
      .returns(Promise.resolve(null));
    jobsStub = sinon
      .stub(BetaGouv, 'getJobs').returns(Promise.resolve(
        [{
          "id": "/recrutement/2022/05/31/developpeur-se.full.stack.4.jours.par.semaine",
          "domaines": [Domaine.DEVELOPPEMENT],
          "title": "        Développeur.se full stack – 4 jours par semaine - Offre de France Chaleur Urbaine        ",
          "url": "http://localhost:4000/recrutement/2022/05/31/developpeur-se.full.stack.4.jours.par.semaine.html",
          "published": (new Date()).toISOString(),
          "updated": "2022-05-31 15:52:38 +0200",
          "author": "beta.gouv.fr",
          "technos": "",
          "content": "",
          }],
      ));
    chat = sinon.spy(BetaGouv, 'sendInfoToChat');
    clock = sinon.useFakeTimers(new Date(fakeDate));
    nock(
      'https://mattermost.incubateur.net/^.*api/v4/users?per_page=200&page=0'
    )
      .get(/.*/)
      .reply(200, [...mattermostUsers]);
    nock(
      'https://mattermost.incubateur.net/^.*api/v4/users?per_page=200&page=1'
    )
      .get(/.*/)
      .reply(200, []);
  });

  afterEach(async () => {
    chat.restore();
    clock.restore();
    sendEmailStub.restore();
    jobsStub.restore();
    utils.cleanMocks();
  });

  it('should send message to users', async () => {
    await knex('users').insert({
      username: 'membre.quipart',
      primary_email: 'membre.quipart@modernisation.gouv.fr',
      secondary_email: 'membre.emailsecondary@gmail.com'
    })
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, betaGouvUsers);
    const { sendContractEndingMessageToUsers } = userContractEndingScheduler;
    await sendContractEndingMessageToUsers('mail15days', true);
    chat.calledOnce.should.be.true;
    chat.firstCall.args[2].should.be.equal('membre.quipart');
    sendEmailStub.firstCall.args[0] = 'membre.quipart@modernisation.gouv.fr,membre.emailsecondary@gmail.com'
    await knex('users').where({
      username: 'membre.quipart',
    }).delete()
  });

  it('should send message to users for j-30 with jobs', async () => {
    await knex('users').insert({
      username: 'membre.quipart',
      primary_email: 'membre.quipart@modernisation.gouv.fr',
      secondary_email: 'membre.emailsecondary@gmail.com'
    })
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, betaGouvUsers);
    const { sendContractEndingMessageToUsers } = userContractEndingScheduler;
    try {
      await sendContractEndingMessageToUsers('mail30days', true);
    } catch(e) {
      console.log(e)
    }
    chat.calledOnce.should.be.true;
    chat.firstCall.args[2].should.be.equal('membre.quipart');
    sendEmailStub.firstCall.args[0] = 'membre.quipart@modernisation.gouv.fr,membre.emailsecondary@gmail.com'
    await knex('users').where({
      username: 'membre.quipart',
    }).delete()
  });


  it('should send j1 mail to users', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, [
        {
          id: 'julien.dauphant',
          fullname: 'Julien Dauphant',
          missions: [
            {
              start: '2016-11-03',
              end: fakeDateLess1day,
              status: 'independent',
              employer: 'octo',
            },
          ],
        },
      ])
      .persist();
    await sendInfoToSecondaryEmailAfterXDays(1);
    // sendEmail not call because secondary email does not exists for user
    sendEmailStub.calledOnce.should.be.false;
    await knex('users').where({
      username: 'julien.dauphant',
    }).update({
      secondary_email: 'uneadressesecondaire@gmail.com',
    });
    await sendInfoToSecondaryEmailAfterXDays(1);
    sendEmailStub.calledOnce.should.be.true;
    await knex('users').where({
      username: 'julien.dauphant',
    }).update({
      secondary_email: null
    })
  });

  it('should delete user ovh account if email status suspended for more than 30 days', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, [
        {
          id: 'membre.expire',
          fullname: 'Membre expire',
          missions: [
            {
              start: '2016-11-03',
              end: fakeDateLess30days,
              status: 'independent',
              employer: 'octo',
            },
          ],
        },
      ])
      .persist();
      await knex('users').where({
        username: 'membre.expire'
      }).update({
        primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
        primary_email_status_updated_at: new Date()
      })
    const ovhEmailDeletion = nock(/.*ovh.com/)
      .delete(/^.*email\/domain\/.*\/account\/membre.expire/)
      .reply(200);
    await deleteOVHEmailAcounts();
    ovhEmailDeletion.isDone().should.be.false;
    const today = new Date()
    const todayLess30days = new Date()
    todayLess30days.setDate(today.getDate() - 31)
    await knex('users').where({
      username: 'membre.expire'
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
      primary_email_status_updated_at: todayLess30days
    })
    await deleteOVHEmailAcounts();
    const user = await knex('users').where({
      username: 'membre.expire'
    }).first()
    user.primary_email_status.should.be.equal(EmailStatusCode.EMAIL_DELETED)
    ovhEmailDeletion.isDone().should.be.true;
  });

  it('should not delete user secondary_email if suspended less than 30days', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, [
        {
          id: 'julien.dauphant',
          fullname: 'Julien Dauphant',
          missions: [
            {
              start: '2016-11-03',
              end: fakeDateLess30days,
              status: 'independent',
              employer: 'octo',
            },
          ],
        },
      ])
      .persist();
    const today = new Date()
    const todayLess29days = new Date()
    todayLess29days.setDate(today.getDate() - 29)
    await knex('users').where({
      username: 'julien.dauphant',
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_DELETED,
      primary_email_status_updated_at: todayLess29days,
      secondary_email: 'uneadressesecondaire@gmail.com',
    });
    const [user1] = await knex('users').where({
      username: 'julien.dauphant',
    });
    should.equal(user1.secondary_email, 'uneadressesecondaire@gmail.com');

    const todayLess31days = new Date()
    todayLess31days.setDate(today.getDate() - 31)
    await knex('users').where({
      username: 'julien.dauphant',
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_DELETED,
      primary_email_status_updated_at: todayLess31days,
      secondary_email: 'uneadressesecondaire@gmail.com',
    });
    await deleteSecondaryEmailsForUsers();
    const [user2] = await knex('users').where({
      username: 'julien.dauphant',
    });
    should.equal(user2.secondary_email, null);
  });

  it('should delete user secondary_email if suspended more than 30days', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, [
        {
          id: 'julien.dauphant',
          fullname: 'Julien Dauphant',
          missions: [
            {
              start: '2016-11-03',
              end: fakeDateLess30days,
              status: 'independent',
              employer: 'octo',
            },
          ],
        },
      ])
      .persist();
    const today = new Date()
    const todayLess31days = new Date()
    todayLess31days.setDate(today.getDate() - 31)
    await knex('users').where({
      username: 'julien.dauphant',
    }).update({
      primary_email_status: EmailStatusCode.EMAIL_DELETED,
      primary_email_status_updated_at: todayLess31days,
      secondary_email: 'uneadressesecondaire@gmail.com',
    });
    await deleteSecondaryEmailsForUsers();
    const [user2] = await knex('users').where({
      username: 'julien.dauphant',
    });
    should.equal(user2.secondary_email, null);
    await knex('users')
      .where({
        username: 'julien.dauphant',
      })
      .update({
        secondary_email: null
      })
  });
});

describe('After quitting', () => {
  let clock;
  let sendEmailStub;
  beforeEach(async () => {
    utils.cleanMocks();
    utils.mockSlackGeneral();
    utils.mockSlackSecretariat();
    utils.mockOvhTime();
    utils.mockOvhRedirections();
    utils.mockOvhUserResponder();
    utils.mockOvhUserEmailInfos();
    utils.mockOvhAllEmailInfos();
    sendEmailStub = sinon
      .stub(email, 'sendEmail')
      .returns(Promise.resolve(null));
    clock = sinon.useFakeTimers(new Date(fakeDate));
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, [
        {
          id: 'julien.dauphant',
          fullname: 'Julien Dauphant',
          missions: [
            {
              start: '2016-11-03',
              end: fakeDateLess1day,
              status: 'independent',
              employer: 'octo',
            },
          ],
        },
        {
          id: 'julien.dauphant2',
          fullname: 'Julien Dauphant',
          missions: [
            {
              start: '2016-11-03',
              end: fakeDateLess30days,
              status: 'independent',
              employer: 'octo',
            },
          ],
        },
      ]);
  });

  afterEach(async () => {
    clock.restore();
    sendEmailStub.restore();
    utils.cleanMocks();
  });

  it('should delete users redirections at j+1', async () => {
    const test: unknown[] = await deleteRedirectionsAfterQuitting();
    should.equal(test.length, 1);
  });

  it('could delete redirections even for past users', async () => {
    const test: unknown[] = await deleteRedirectionsAfterQuitting(true);
    should.equal(test.length, 2);
  });

  it('could delete redirections even for past users', async () => {
    const test: unknown[] = await deleteRedirectionsAfterQuitting(true);
    should.equal(test.length, 2);
  });

  it('should set email as expired', async() => {
    const today = new Date(fakeDate);
    const todayLess31days = new Date()
    todayLess31days.setDate(today.getDate() - 31)
    const userinfos = sinon
      .stub(betagouv, 'usersInfos')
      .returns(Promise.resolve([{
        id: 'membre.actif',
        fullname: 'membre actif',
        employer: 'Dinum',
        startups: [],
        domaine: 'Animation',
        start: '2020-01-01',
        end: todayLess31days.toISOString().split('T')[0],
        missions: []
      }]));

    await knex('users').where({
      username: 'membre.actif',
    }).update({
      primary_email: 'membre.actif@modernisation.gouv.fr',
      primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
      primary_email_status_updated_at: todayLess31days
    })
    await setEmailExpired()
    const [ user ] = await knex('users').where({
      username: 'membre.actif'
    })
    user.primary_email_status.should.equal(EmailStatusCode.EMAIL_EXPIRED)
    userinfos.restore()
  })

  it('should remove user from mailingList', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, [{
      "id": "julien.dauphant",
      "fullname": "Julien Dauphant",
      "missions": [
        { 
          "start": "2016-11-03",
          "end": fakeDateLess30days,
          "status": "independent",
          "employer": "octo"
        }
      ]
    }]).persist()
    const ovhMailingList = nock(/.*ovh.com/)
    .get(/^.*email\/domain\/.*\/mailingList\//)
    .reply(200, ['beta-gouv-fr', 'aides-jeunes']);
    const mailingListBeta = nock(/.*ovh.com/)
    .delete(uri => uri.includes(`/email/domain/${config.domain}/mailingList/beta-gouv-fr/subscriber/julien.dauphant2@${config.domain}`))
    .reply(404)
    const mailingListAideJeune = nock(/.*ovh.com/)
    .delete(uri => uri.includes(`/email/domain/${config.domain}/mailingList/aides-jeunes/subscriber/julien.dauphant2@${config.domain}`))
    .reply(200, {
      action: "mailinglist/deleteSubscriber",
      id: 14564515,
      language: "fr",
      domain: config.domain,
      account: "aides-jeunes",
      date: "2021-08-12T15:29:55+02:00"
    })
    await removeEmailsFromMailingList()
    ovhMailingList.isDone().should.be.true;
    mailingListBeta.isDone().should.be.true;
    mailingListAideJeune.isDone().should.be.true;
  }); 
});
