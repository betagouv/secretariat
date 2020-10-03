const chai = require('chai');
const sinon = require('sinon');

const app = require('../index');
const controllerUtils = require('../controllers/utils');

describe('Onboarding', () => {

  describe("GET /onboarding", () => {
    it('should return a valid page', (done) => {
      chai.request(app)
        .get('/onboarding')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });
  });

  describe("POST /onboarding", () => {

    beforeEach((done) => {
      this.getGithubMasterSha = sinon
        .stub(controllerUtils, 'getGithubMasterSha')
        .resolves({ data: { object: { sha: 'sha' } }});

      this.createGithubBranch = sinon
        .stub(controllerUtils, 'createGithubBranch')
        .resolves(true);

      this.createGithubFile = sinon.
        stub(controllerUtils, 'createGithubFile')
        .resolves(true);

      this.makeGithubPullRequest = sinon
        .stub(controllerUtils, 'makeGithubPullRequest')
        .resolves(true);

      done();
    })

    afterEach((done) => {
      this.getGithubMasterSha.restore();
      this.createGithubBranch.restore();
      this.createGithubFile.restore();
      this.makeGithubPullRequest.restore();
      done();
    });

    it("should not call Github API if a mandatory field is missing", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          // firstName missing
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it("should not call Github API if a date is wrong", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          lastName: 'Úñíbe',
          role: 'Dev',
          start: 'aaaa-bb-cc',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it("should not call Github API if a date doesn't exist", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-42-42',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it("should not call Github API if the end date is smaller than the start date", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-12-31',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it("should not call Github API if the start date is too small", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2000-01-01',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it("should call Github API if mandatory fields are present", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          this.getGithubMasterSha.calledOnce.should.be.true;
          this.createGithubBranch.calledOnce.should.be.true;
          this.createGithubFile.calledOnce.should.be.true;
          this.makeGithubPullRequest.calledOnce.should.be.true;
          done();
        });
    });

    it("branch should be created on latest SHA", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          const sha = this.createGithubBranch.args[0][0];
          sha.should.equal('sha')
          done();
        });
    });

    it("filename should not contain accents", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          const path = this.createGithubFile.args[0][0];
          path.should.contain('fernandao.unibe.md')
          done();
        });
    });

    it("branch name should not contain accents", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          const branch = this.createGithubBranch.args[0][1];
          branch.should.contain('author-fernandao-unibe-')
          done();
        });
    });

    it("special characters should be replaced with dashes in the filename", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'René d\'Herblay',
          lastName: 'D\'Aramitz',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant'
        })
        .end((err, res) => {
          const path = this.createGithubFile.args[0][0];
          path.should.contain('rene-d-herblay.d-aramitz.md')
          done();
        });
    });

    it("should redirect to onboarding success page", (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'René d\'Herblay',
          lastName: 'D\'Aramitz',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant'
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/onboardingSuccess');
          done();
        });
    });
  });
});
