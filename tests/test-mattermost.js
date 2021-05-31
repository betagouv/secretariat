const rewire = require('rewire');
const nock = require('nock');
const sinon = require('sinon');
const utils = require('./utils.js');
const testUsers = require('./users.json');
const config = require('../src/config');

const mattermostUsers = [
  {
    id: 'membre.actif',
    email: `membre.actif@${config.domain}`,
  },
  {
    id: 'julien.dauphant',
    email: `julien.dauphant@${config.domain}`,
  },
  {
    id: 'thomas.guillet',
    email: `thomas.guillet@${config.domain}`,
  },
  {
    id: 'countdoesnotexist',
    email: `countdoesnotexist@${config.domain}`,
  },
];

const mattermostScheduler = rewire('../src/schedulers/mattermostScheduler');

describe('getMattermostUserNotInTeam', () => {
  let clock;
  beforeEach(async () => {
    const date = new Date('2021-01-20T07:59:59+01:00');
    clock = sinon.useFakeTimers(date);
    utils.cleanMocks();
  });

  afterEach(async () => {
    clock.restore();
  });

  it('Add user to team', async () => {
    nock(/.*mattermost.incubateur.net/)
    .get(/^.*api\/v4\/users.*/)
    .reply(200, [...mattermostUsers]);
    nock(/.*mattermost.incubateur.net/)
    .get(/^.*api\/v4\/users.*/)
    .reply(200, []);

    const postBatchMock = nock(/.*mattermost.incubateur.net/)
    .post(/^.*api\/v4\/teams\/testteam\/members\/batch.*/)
    .reply(200, [{}, {}]).persist();

    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, testUsers)
    .persist();
    const addUsersToTeam = mattermostScheduler.__get__('addUsersToTeam');
    const result = await addUsersToTeam([...mattermostUsers]);
    result.length.should.be.equal(2);
  });
});
