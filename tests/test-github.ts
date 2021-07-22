import nock from 'nock';
import sinon from 'sinon';
import * as github from '../src/lib/github';
import { addGithubUserToOrganization } from "../src/schedulers/githubScheduler";
import testUsers from './users.json';

const githubOrganizationMembers = [
  {
    id: '24545',
    login: 'a.membre',
  },
  {
    id: '5451659',
    login: 'jdauphant',
  },
  {
    id: '54515',
    login: 'gguillet',
  },
  {
    id: '4851',
    login: 'countdoesnotexist',
  },
];

describe('Add user to github organization', () => {
  let inviteUser;
  let pendingInvitations;
  let getGithubMembers = sinon.stub(github, 'getAllOrganizationMembers').resolves(githubOrganizationMembers);

  beforeEach(() => {
    inviteUser = sinon.stub(github, 'inviteUserByUsernameToOrganization').resolves(true);
    pendingInvitations = sinon.stub(github, 'getAllPendingInvitations').resolves([])
  })

  afterEach(() => {
    pendingInvitations.restore();
    inviteUser.restore();
  })

  it('should add new users to organization', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
    .get((uri) => uri.includes('authors.json'))
    .reply(200, testUsers)
    .persist();

    await addGithubUserToOrganization();
    inviteUser.calledTwice.should.be.true;
    inviteUser.firstCall.args[0].should.equal('membre.actif');
    inviteUser.secondCall.args[0].should.equal('test-github');
  });

  it('should not add new users to organization if invitation exist', async () => {
    pendingInvitations.resolves([{ login: 'membre.actif' }])
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, testUsers)
      .persist();

    await addGithubUserToOrganization();
    inviteUser.calledOnce.should.be.true;
    inviteUser.firstCall.args[0].should.equal('test-github');
  });
});
