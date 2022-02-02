import nock from 'nock';
import sinon from 'sinon';
import betagouv from '../src/betagouv';
import * as controllerUtils from '../src/controllers/utils';
import * as github from '../src/lib/github';
import { pullRequestWatcher } from '../src/schedulers/pullRequestWatcher';

describe('Pull requests watchers', () => {
  let getPullRequestsStub;
  let getPullRequestFilesStub;
  let sendEmailStub;
  let mattermostMessageStub;

  const PRexamples = [{
    "url": "https://api.github.com/repos/octocat/Hello-World/pulls/1347",
    "id": 1,
    "number": 1347,
    "updated_at": new Date().toISOString()
  },
  {
    "url": "https://api.github.com/repos/octocat/Hello-World/pulls/1347",
    "id": 1,
    "number": 1347,
    "updated_at": "2011-01-26T19:01:12Z"
  },
  ];

  beforeEach((done) => {
    getPullRequestsStub = sinon.stub(github, 'getPullRequests').returns(Promise.resolve({
        data: PRexamples,
        url: '',
    }));
    getPullRequestFilesStub = sinon.stub(github, 'getPullRequestFiles').returns(Promise.resolve({
        data: [{
          filename: 'membre.actif.md',
          contents_url: 'https://api.github.com/repos/octocat/content/_authors/membre.actif.md'
        }]
    }));
    sendEmailStub = sinon
      .stub(controllerUtils, 'sendMail')
      .returns(Promise.resolve(true));
    mattermostMessageStub = sinon.stub(betagouv, 'sendInfoToChat')
    done()
  });

  afterEach((done) => {
    getPullRequestsStub.restore();
    getPullRequestFilesStub.restore();
    sendEmailStub.restore();
    mattermostMessageStub.restore();
    done()
  });

  it('should get pending requests and inspect file with authors and send mattermost', async () => {
    nock(
      'https://mattermost.incubateur.net/api/v4/users/search'
    )
      .post(/.*/)
      .reply(200, [
          {
            "id": "string",
            "create_at": 0,
            "update_at": 0,
            "delete_at": 0,
            "username": "string",
            "first_name": "string",
            "last_name": "string",
            "nickname": "string",
            "email": "string",
            "email_verified": true,
            "auth_service": "string",
            "roles": "string",
            "locale": "string",
          }
        ]
      );
    await pullRequestWatcher()
    getPullRequestsStub.calledOnce.should.be.true;
    getPullRequestFilesStub.calledOnce.should.be.true;
    mattermostMessageStub.calledOnce.should.be.true;
    sendEmailStub.calledOnce.should.be.false;
  });

  it('should get pending requests and send email to users', async () => {
    nock(
      'https://mattermost.incubateur.net/api/v4/users/search'
    )
      .post(/.*/)
      .reply(200, [
        ]
      );
    await pullRequestWatcher()
    getPullRequestsStub.calledOnce.should.be.true;
    getPullRequestFilesStub.calledOnce.should.be.true;
    mattermostMessageStub.calledOnce.should.be.false;
    sendEmailStub.calledOnce.should.be.true;
  })
});
