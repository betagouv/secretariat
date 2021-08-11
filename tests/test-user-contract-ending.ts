import nock from 'nock'
import sinon from 'sinon'
import BetaGouv from '../src/betagouv'
import config from '../src/config'
import utils from './utils'
import * as controllerUtils from '../src/controllers/utils'
import knex from '../src/db';
import {
  sendInfoToSecondaryEmailAfterXDays,
  deleteOVHEmailAcounts
} from '../src/schedulers/userContractEndingScheduler'

const fakeDate = '2020-01-01T09:59:59+01:00';
const fakeDateLess1day = '2019-12-31';
const fakeDateMore15days = '2020-01-16';
const fakeDateLess30days = '2019-12-01'

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
    email: `membre.quipart@${config.domain}`,
    username: 'membre.quipart',
  },
  {
    id: 'countdoesnotexist',
    email: `countdoesnotexist@${config.domain}`,
  },
];

const userContractEndingScheduler = require('../src/schedulers/userContractEndingScheduler');

describe('send message on contract end to user', () => {
  let chat;
  let clock;
  let sendEmailStub;
  beforeEach(async () => {
    utils.cleanMocks();
    utils.mockSlackGeneral();
    utils.mockSlackSecretariat();
    utils.mockOvhTime();
    utils.mockOvhRedirections();
    utils.mockOvhUserEmailInfos();
    utils.mockOvhAllEmailInfos();
    sendEmailStub = sinon
      .stub(controllerUtils, 'sendMail')
      .returns(Promise.resolve(true));
    chat = sinon.spy(BetaGouv, 'sendInfoToChat');
    clock = sinon.useFakeTimers(new Date(fakeDate));
    nock('https://mattermost.incubateur.net/^.*api\/v4\/users?per_page=200&page=0')
    .get(/.*/)
    .reply(200, [...mattermostUsers]);
    nock('https://mattermost.incubateur.net/^.*api\/v4\/users?per_page=200&page=1')
    .get(/.*/)
    .reply(200, []);
  });

  afterEach(async () => {
    chat.restore();
    clock.restore();
    sendEmailStub.restore();
    utils.cleanMocks();
  });

  it('should send message to users', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, betaGouvUsers)
    const { sendContractEndingMessageToUsers } = userContractEndingScheduler;
    await sendContractEndingMessageToUsers('mail15days');
    console.log(chat);
    chat.calledOnce.should.be.true;
    chat.firstCall.args[2].should.be.equal('membre.quipart');
  });

  it('should send j1 mail to users', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, [{
      "id": "julien.dauphant",
      "fullname": "Julien Dauphant",
      "missions": [
        { 
          "start": "2016-11-03",
          "end": fakeDateLess1day,
          "status": "independent",
          "employer": "octo"
        }
      ]
    }]).persist()
    const { sendJ1Email } = userContractEndingScheduler;
    await sendInfoToSecondaryEmailAfterXDays(1);
    // sendEmail not call because secondary email does not exists for user
    sendEmailStub.calledOnce.should.be.false;
    await knex('users').insert({
      secondary_email: 'uneadressesecondaire@gmail.com',
      username: 'julien.dauphant'
    })
    await sendInfoToSecondaryEmailAfterXDays(1)
    console.log(sendEmailStub.firstCall.args);
    sendEmailStub.calledOnce.should.be.true;
  });  

  it('should delete user ovh account', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, [{
      "id": "membre.expire",
      "fullname": "Membre expire",
      "missions": [
        { 
          "start": "2016-11-03",
          "end": fakeDateLess30days,
          "status": "independent",
          "employer": "octo"
        }
      ]
    }]).persist()
    const ovhEmailDeletion = nock(/.*ovh.com/)
      .delete(/^.*email\/domain\/.*\/account\/membre.expire/)
      .reply(200);
    await deleteOVHEmailAcounts()
    ovhEmailDeletion.isDone().should.be.true;
  });
});
