import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import pullRequestWatcher from '../src/schedulers/pullRequestWatcher'
import * as github from '../src/lib/github'
chai.use(chaiHttp);

describe('Login token', () => {
  let getPullRequestsStub;
  let getPullRequestFilesStub;

  beforeEach((done) => {
    getPullRequestsStub = sinon.stub(github, 'getPullRequests').returns(Promise.resolve({
        data: [PRexample],
        url: '',
    }));
    getPullRequestFilesStub = sinon.stub(github, 'getPullRequestFiles').returns(Promise.resolve({
        data: [{
          filename: 'jean.pascale.md',
          contents_url: 'https://api.github.com/repos/octocat/content/_authors/jean.pascale.md'
        }]
    }));
    done();
  });

  afterEach((done) => {
    getPullRequestsStub.restore();
    getPullRequestFilesStub.restore();
    done();
  });

  it('should pull pending requests', async () => {
    await pullRequestWatcher()
    getPullRequestsStub.calledOnce.should.be.true;
    getPullRequestFilesStub.calledOnce.should.be.true;
  });
});

const PRexample =   {
  "url": "https://api.github.com/repos/octocat/Hello-World/pulls/1347",
  "id": 1,
  "number": 1347
};