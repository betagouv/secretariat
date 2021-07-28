import rewire from 'rewire';
import nock from 'nock';
import sinon from 'sinon';
import BetaGouv from '../src/betagouv';
import config from '../src/config';
import utils from './utils';
import * as controllerUtils from '../src/controllers/utils';

const fakeDate = '2020-01-01T09:59:59+01:00';
const fakeDateMore1day = '2020-01-02';
const fakeDateMore15days = '2020-01-16';

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

const userContractEndingScheduler = rewire(
  '../src/schedulers/userContractEndingScheduler.ts'
);

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
  });

  afterEach(async () => {
    chat.restore();
    clock.restore();
    sendEmailStub.restore();
    utils.cleanMocks();
  });

  it('send message to users', async () => {
    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, [...mattermostUsers]);
    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, []);

    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, betaGouvUsers)
      .persist();
    const { sendContractEndingMessageToUsers } = userContractEndingScheduler;
    await sendContractEndingMessageToUsers('mail15days');
    console.log(chat);
    chat.calledOnce.should.be.true;
    chat.firstCall.args[2].should.be.equal('membre.quipart');
  });

  it('send j+1 mail to users', async () => {
    nock(/.*mattermost.incubateur.net/)
    .get(/^.*api\/v4\/users.*/)
    .reply(200, [...mattermostUsers]);
    nock(/.*mattermost.incubateur.net/)
    .get(/^.*api\/v4\/users.*/)
    .reply(200, []);

    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, [{
      "id": "julien.dauphant",
      "fullname": "Julien Dauphant",
      "missions": [
        { 
          "start": "2016-11-03",
          "end": fakeDateMore1day,
          "status": "independent",
          "employer": "octo"
        }
      ]
    }])
    .persist();
    const { sendJ1Email } = userContractEndingScheduler;
    const result = await sendJ1Email();
    sendEmailStub.calledOnce.should.be.true;
    console.log(sendEmailStub.firstCall.args);
  });
});


