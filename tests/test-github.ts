import nock from 'nock';
import sinon from 'sinon';
import github from '../src/lib/github';
import testUsers from './users.json';
import { addGithubUserToOrganization } from '../src/schedulers/githubScheduler';

const githubOrganizationMembers = [
  {
    id: '24545',
    login: 'membreactif',
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
  let getGithubMembers;

  beforeEach(() => {
    getGithubMembers = sinon.stub(github, 'getAllOrganizationMembers').resolves(githubOrganizationMembers);

    inviteUser = sinon.stub(github, 'inviteUserByUsername').resolves(true);
  });

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
});
