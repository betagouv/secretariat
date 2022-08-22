import nock from 'nock';
import sinon from 'sinon';
import * as github from '@/lib/github';
import testUsers from './users.json';
import {
  addGithubUserToOrganization,
  removeGithubUserFromOrganization,
} from '@/schedulers/githubScheduler';

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
  let addUserToTeam;
  let pendingInvitations;
  let getGithubMembers;

  beforeEach(() => {
    getGithubMembers = sinon
      .stub(github, 'getAllOrganizationMembers')
      .resolves(githubOrganizationMembers);
    inviteUser = sinon
      .stub(github, 'inviteUserByUsernameToOrganization')
      .resolves();
    addUserToTeam = sinon
      .stub(github, 'addUserToTeam')
      .resolves();
    pendingInvitations = sinon
      .stub(github, 'getAllPendingInvitations')
      .resolves([]);
  });

  afterEach(() => {
    pendingInvitations.restore();
    inviteUser.restore();
    addUserToTeam.restore();
    getGithubMembers.restore();
  });

  it('should add new users to organization', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, testUsers)
      .persist();

    await addGithubUserToOrganization();
    inviteUser.calledTwice.should.be.true;
    addUserToTeam.calledTwice.should.be.true;

    inviteUser.firstCall.args[0].should.equal('membre.actif');
    addUserToTeam.firstCall.args[0].should.equal('membre.actif');

    inviteUser.secondCall.args[0].should.equal('test-github');
    addUserToTeam.secondCall.args[0].should.equal('test-github');
  });

  it('should not add new users to organization if invitation exist', async () => {
    pendingInvitations.resolves([{ login: 'membre.actif' }]);
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, testUsers)
      .persist();

    await addGithubUserToOrganization();
    inviteUser.calledOnce.should.be.true;
    addUserToTeam.calledOnce.should.be.true;
    
    inviteUser.firstCall.args[0].should.equal('test-github');
    addUserToTeam.firstCall.args[0].should.equal('test-github');
  });
});

describe('Removed user from github organization', () => {
  let removeUser;
  let getGithubMembers;

  beforeEach(() => {
    removeUser = sinon
      .stub(github, 'removeUserByUsernameFromOrganization')
      .resolves();
    getGithubMembers = sinon
      .stub(github, 'getAllOrganizationMembers')
      .resolves([
        ...githubOrganizationMembers,
        {
          login: 'membre.expire',
          id: '45548',
        },
      ]);
  });

  afterEach(() => {
    removeUser.restore();
    getGithubMembers.restore();
  });

  it('should add new users to organization', async () => {
    const url = process.env.USERS_API || 'https://beta.gouv.fr';
    nock(url)
      .get((uri) => uri.includes('authors.json'))
      .reply(200, testUsers)
      .persist();

    await removeGithubUserFromOrganization();
    removeUser.calledOnce.should.be.true;
    removeUser.firstCall.args[0].should.equal('membre.expire');
  });
});
