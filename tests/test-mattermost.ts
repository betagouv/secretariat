import nock from 'nock';
import rewire from 'rewire';
import sinon from 'sinon';
import config from '../src/config';
import testUsers from './users.json';
import utils from './utils';
import * as mattermost from '../src/lib/mattermost';
import * as controllerUtils from '../src/controllers/utils';
import knex from '../src/db';

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

describe('invite users to mattermost', () => {
  let clock;

  beforeEach(async () => {
    const date = new Date('2021-01-20T07:59:59+01:00');
    clock = sinon.useFakeTimers(date);
    utils.cleanMocks();
    utils.mockOvhTime();
  });

  afterEach(async () => {
    clock.restore();
  });

  it('invite users to team by emails', async () => {
    nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/account/)
      .reply(
        200,
        testUsers.map((user) => user.id)
      );

    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, [...mattermostUsers]);
    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, []);

    nock(/.*mattermost.incubateur.net/)
      .post(/^.*api\/v4\/teams\/testteam\/invite\/email.*/)
      .reply(200, [{}, {}])
      .persist();

    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, testUsers)
      .persist();
    const { inviteUsersToTeamByEmail } = mattermostScheduler;
    const result = await inviteUsersToTeamByEmail();
    result.length.should.be.equal(2);
  });

  it('create users to team by emails', async () => {
    nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/account/)
      .reply(
        200,
        testUsers.map((user) => user.id)
      );

    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, [...mattermostUsers]);
    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, []);
    nock(/.*mattermost.incubateur.net/)
      .post(/^.*api\/v4\/users\?iid=.*/)
      .reply(200, [])
      .persist();
    const sendEmailStub = sinon
      .stub(controllerUtils, 'sendMail')
      .returns(Promise.resolve(true));
    const mattermostCreateUser = sinon.spy(mattermost, 'createUser');

    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, testUsers)
      .persist();
    const { createUsersByEmail } = mattermostScheduler;
    const result = await createUsersByEmail();
    result.length.should.be.equal(1);
    mattermostCreateUser.calledOnce.should.be.true;
    sendEmailStub.calledOnce.should.be.true;
    sendEmailStub.restore();
    mattermostCreateUser.firstCall.args[0].email = `mattermost.newuser@${config.domain}`;
    mattermostCreateUser.firstCall.args[0].username = 'mattermost.newuser';
  });
});

const inactiveMattermostUsers = [
  {
    id: 'julien.dauphant',
    email: `julien.dauphant@${config.domain}`,
  },
];

describe('Reactivate current users on mattermost', () => {
  let clock;
  beforeEach(async () => {
    const date = new Date('2021-01-20T07:59:59+01:00');
    clock = sinon.useFakeTimers(date);
    utils.cleanMocks();
  });

  afterEach(async () => {
    clock.restore();
  });

  it('reactivate current users', async () => {
    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, [...inactiveMattermostUsers]);
    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, []);

    nock(/.*mattermost.incubateur.net/)
      .put(/^.*api\/v4\/users\/julien.dauphant\/active/)
      .reply(200, [{ status: 'ok' }])
      .persist();

    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, testUsers)
      .persist();

    const { reactivateUsers } = mattermostScheduler;
    const result = await reactivateUsers();
    result.length.should.be.equal(1); // il n'y a qu'un utilisateur inactif simulé (julien.dauphant)
  });
});

describe('Move expired user to team Alumni on mattermost', () => {
  let clock;
  beforeEach(async () => {
    const date = new Date('2021-01-20T07:59:59+01:00');
    clock = sinon.useFakeTimers(date);
    utils.cleanMocks();
  });

  afterEach(async () => {
    clock.restore();
  });

  it('Remove expired user from community team on mattermost', async () => {
    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, [
        {
          id: 'julien.dauphant',
          email: `julien.dauphant@${config.domain}`,
        },
      ]);
    nock(/.*mattermost.incubateur.net/)
      .post(/^.*api\/v4\/users\/search.*/)
      .reply(200, [
        {
          id: 265695,
          username: 'julien.dauphant',
          email: 'julien.dauphant',
        },
      ]);

    const removeFromTeamMock = nock(/.*mattermost.incubateur.net/)
      .delete(/^.*api\/v4\/teams\/testteam\/members/)
      .reply(200, [{ status: 'ok' }])
      .persist();

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
              end: '2021-01-17',
              status: 'independent',
              employer: 'octo',
            },
          ],
        },
      ])
      .persist();

    const { removeUsersFromCommunityTeam } = mattermostScheduler;
    const result = await removeUsersFromCommunityTeam();
    removeFromTeamMock.isDone().should.be.true;
    result.length.should.be.equal(1);
  });

  it('Move expired user to team Alumni on mattermost', async () => {
    nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/users.*/)
      .reply(200, [
        {
          id: 'julien.dauphant',
          email: `julien.dauphant@${config.domain}`,
        },
      ]);
    nock(/.*mattermost.incubateur.net/)
      .post(/^.*api\/v4\/users\/search.*/)
      .reply(200, [
        {
          id: 265695,
          username: 'julien.dauphant',
          email: 'julien.dauphant',
        },
      ]);

    const addToTeamMock = nock(/.*mattermost.incubateur.net/)
      .post(/^.*api\/v4\/teams\/testalumniteam\/members/)
      .reply(200, [
        {
          team_id: 'testalumniteam',
          user_id: 265695,
          roles: 'string',
          delete_at: 0,
          scheme_user: true,
          scheme_admin: true,
          explicit_roles: 'string',
        },  
      ])
      .persist();

    const patchEmailMock = nock(/.*mattermost.incubateur.net/)
      .put(/^.*api\/v4\/users.*/)
      .reply(200, [])
      .persist();

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
              end: '2021-01-17',
              status: 'independent',
              employer: 'octo',
            },
          ],
        },
      ])
      .persist();

    const { moveUsersToAlumniTeam } = mattermostScheduler;
    let result = await moveUsersToAlumniTeam();
    addToTeamMock.isDone().should.be.false;
    patchEmailMock.isDone().should.be.false;
    result.length.should.be.equal(0);
    await knex('users').insert({
      secondary_email: 'uneadressesecondaire@gmail.com',
      username: 'julien.dauphant'
    })
    result = await moveUsersToAlumniTeam();
    addToTeamMock.isDone().should.be.true;
    patchEmailMock.isDone().should.be.true;
    result.length.should.be.equal(1);
    await knex('users').where({
      username: 'julien.dauphant'
    }).delete()
  });

  });
