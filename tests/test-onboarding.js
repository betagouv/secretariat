const chai = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const app = require('../index');
const utils = require('./utils.js');
const controllerUtils = require('../controllers/utils');
const knex = require('../db');

describe('Onboarding', () => {
  describe('GET /onboarding', () => {
    it('should return a valid page', (done) => {
      nock.cleanAll();

      utils.mockStartups();

      chai.request(app)
        .get('/onboarding')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });
  });

  describe('POST /onboarding', () => {
    beforeEach((done) => {
      this.getGithubMasterSha = sinon
        .stub(controllerUtils, 'getGithubMasterSha')
        .resolves({ data: { object: { sha: 'sha' } } });

      this.createGithubBranch = sinon
        .stub(controllerUtils, 'createGithubBranch')
        .resolves(true);

      this.createGithubFile = sinon
        .stub(controllerUtils, 'createGithubFile')
        .resolves(true);

      this.makeGithubPullRequest = sinon
        .stub(controllerUtils, 'makeGithubPullRequest')
        .resolves({ status: 201, data: { html_url: 'https://example.com/' } });

      this.sendEmailStub = sinon
        .stub(controllerUtils, 'sendMail')
        .returns(true);

      done();
    });

    afterEach((done) => {
      this.getGithubMasterSha.restore();
      this.createGithubBranch.restore();
      this.createGithubFile.restore();
      this.makeGithubPullRequest.restore();
      this.sendEmailStub.restore();
      knex('users').truncate()
        .then(() => done());
    });

    it('should not call Github API if a mandatory field is missing', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          // firstName missing
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if a date is wrong', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: 'aaaa-bb-cc',
          end: '2021-01-01',
          status: 'Independant',
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
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-42-42',
          end: '2021-01-01',
          status: 'Independant',
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if the end date is smaller than the start date', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2021-12-31',
          end: '2020-01-01',
          status: 'Independant',
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if the start date is too small', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2000-01-01',
          end: '2021-01-01',
          status: 'Independant',
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if the website field is not a full url', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          website: 'example.com/me',
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if the github username field is an url', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          github: 'https://github.com/betagouv',
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if the github username field is an url (even without http)', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          github: 'github.com/betagouv',
        })
        .end((err, res) => {
          this.getGithubMasterSha.called.should.be.false;
          this.createGithubBranch.called.should.be.false;
          this.createGithubFile.called.should.be.false;
          this.makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should call Github API if mandatory fields are present', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .end((err, res) => {
          this.getGithubMasterSha.calledOnce.should.be.true;
          this.createGithubBranch.calledOnce.should.be.true;
          this.createGithubFile.calledOnce.should.be.true;
          this.makeGithubPullRequest.calledOnce.should.be.true;
          done();
        });
    });

    it('branch should be created on latest SHA', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          website: 'https://example.com/me',
          email: 'test@example.com',
        })
        .end((err, res) => {
          const sha = this.createGithubBranch.args[0][0];
          sha.should.equal('sha');
          done();
        });
    });

    it('branch name should not contain accents or special characters', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Raphaël Férnàndáô',
          lastName: 'Úñíïbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .end((err, res) => {
          const branch = this.createGithubBranch.args[0][1];
          branch.should.contain('author-raphael-fernandao-uniibe-');
          done();
        });
    });

    it('filename should handle multiple spaces gracefully', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Jean   .  Jacques\'    .',
          lastName: '    Dupont    ',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .end((err, res) => {
          const path = this.createGithubFile.args[0][0];
          path.should.contain('jean-jacques.dupont.md');
          done();
        });
    });

    it('branch name should not contain accents', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .end((err, res) => {
          const branch = this.createGithubBranch.args[0][1];
          branch.should.contain('author-fernandao-unibe-');
          done();
        });
    });

    it('PR title should contain the referent if specified', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          referent: 'John Doe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .end((err, res) => {
          const prTitle = this.makeGithubPullRequest.args[0][1];
          prTitle.should.contain('Référent : John Doe.');
          done();
        });
    });

    it('Referent should be notified by email', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*membre.actif/)
        .reply(200, { email: 'membre.actif@example.com' });

      utils.mockUsers();

      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          referent: 'membre.actif',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .end((err, res) => {
          this.sendEmailStub.calledOnce.should.be.true;

          const toEmail = this.sendEmailStub.args[0][0];
          toEmail.should.equal('membre.actif@example.com');
          done();
        });
    });

    it('PR title should specfiy if no referent was given', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .end((err, res) => {
          const prTitle = this.makeGithubPullRequest.args[0][1];
          prTitle.should.contain('Référent : pas renseigné.');
          done();
        });
    });

    it('special characters should be replaced with dashes in the filename', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'René d\'Herblay',
          lastName: 'D\'Aramitz',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .end((err, res) => {
          const path = this.createGithubFile.args[0][0];
          path.should.contain('rene-d-herblay.d-aramitz.md');
          done();
        });
    });

    it('only a-z chars should be kept in the filename', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'René 123 *ł',
          lastName: 'D\'A552',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .end((err, res) => {
          const path = this.createGithubFile.args[0][0];
          path.should.contain('rene-l.d-a.md');
          done();
        });
    });

    it('should redirect to onboarding success page', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'René d\'Herblay',
          lastName: 'D\'Aramitz',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.contain('/onboardingSuccess/');
          done();
        });
    });

    it('should store in database the secondary email', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          email: 'test@example.com',
        })
        .then(() => knex('users').where({ username: 'john.doe' }))
        .then((dbRes) => {
          dbRes.length.should.equal(1);
          dbRes[0].secondary_email.should.equal('test@example.com');
        })
        .then(done)
        .catch(done);
    });

    it('DB conflicts in newcomer secondary email should be treated as an update', (done) => {
      knex('users')
        .insert({
          username: 'john.doe',
          secondary_email: 'test@example.com',
        }).then(() => {
          chai.request(app)
            .post('/onboarding')
            .type('form')
            .send({
              firstName: 'John',
              lastName: 'Doe',
              role: 'Dev',
              start: '2020-01-01',
              end: '2021-01-01',
              status: 'Independant',
              email: 'updated@example.com',
            })
            .then(() => knex('users').where({ username: 'john.doe' }))
            .then((dbRes) => {
              dbRes.length.should.equal(1);
              dbRes[0].secondary_email.should.equal('updated@example.com');
            })
            .then(done)
            .catch(done);
        });
    });
  });
});
