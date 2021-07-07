const nock = require('nock');
const sinon = require('sinon');
const utils = require('./utils.js');
const config = require('../src/config');
const github = require('../src/lib/github');
const testUsers = require('./users.json');

const githubOrganizationMembers = [
  {
    id: '24545',
    email: `membre.actif@${config.domain}`,
    username: 'membreactif',
  },
  {
    id: '5451659',
    email: `julien.dauphant@${config.domain}`,
    username: 'jdauphant',
  },
  {
    id: '54515',
    email: `thomas.guillet@${config.domain}`,
    username: 'gguillet',
  },
  {
    id: '4851',
    email: `countdoesnotexist@${config.domain}`,
    username: 'countdoesnotexist',
  },
];

const addGithubUserToOrganization = require('../src/schedulers/githubScheduler').default;

describe('Add user to github organization', () => {
  let clock;
  let inviteUser;
  let getGithubMembers;
  let getUsername;

  beforeEach(() => {
    const date = new Date('2021-01-20T07:59:59+01:00');
    clock = sinon.useFakeTimers(date);
    getGithubMembers = sinon
        .stub(github, 'getAllOrganizationMembers')
        .resolves(githubOrganizationMembers);

    inviteUser = sinon
      .stub(github, 'inviteUserByUsername')
      .resolves(true);

    utils.cleanMocks();
  });

  afterEach(async () => {
    clock.restore();
  });

  it('should add new user to organization', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, testUsers)
    .persist();
    const result = await addGithubUserToOrganization();
    inviteUser.calledTwice.should.be.true;
    inviteUser.firstCall.args[0].github.should.equal('membre.actif');
    inviteUser.secondCall.args[0].github.should.equal('test-github');
  });
});
