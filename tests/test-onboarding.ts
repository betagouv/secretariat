import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import sinon from 'sinon';
import * as controllerUtils from '@/controllers/utils';
import knex from '@/db';
import app from '@/index';
import utils from './utils';
import { EmailStatusCode } from '@/models/dbUser/dbUser';
import betagouv from '@/betagouv';
import * as searchCommune from '@/lib/searchCommune';
import * as email from '@config/email.config'
import * as mattermost from '@/lib/mattermost'
import { MattermostUser } from '@/lib/mattermost';
import * as github from '@/lib/github'

chai.use(chaiHttp);

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
    let getGithubMasterSha;
    let createGithubBranch;
    let createGithubFile;
    let makeGithubPullRequest;
    let sendEmailStub;
    let isPublicServiceEmailStub;
    let mattermostMessageStub;
    let searchCommuneStub;
    let mattermostSearchUser;

    beforeEach((done) => {
      getGithubMasterSha = sinon
        .stub(github, 'getGithubMasterSha')
        .resolves({ headers: null, url: null, status: null, data: { object: { sha: 'sha' } } });

      createGithubBranch = sinon
        .stub(github, 'createGithubBranch')
        .resolves({ headers: null, url: null, status: null, data: {} });

      createGithubFile = sinon
        .stub(github, 'createGithubFile')
        .resolves({ headers: null, url: null, status: null, data: {} });

      makeGithubPullRequest = sinon
        .stub(github, 'makeGithubPullRequest')
        .resolves({ headers: null, url: null, status: 201, data: { html_url: 'https://example.com/' } });

      sendEmailStub = sinon
        .stub(email, 'sendEmail')
        .returns(Promise.resolve(null));

      isPublicServiceEmailStub = sinon
        .stub(controllerUtils, 'isPublicServiceEmail')
        .returns(Promise.resolve(false));
        
      searchCommuneStub = sinon.stub(searchCommune, 'fetchCommuneDetails').returns(Promise.resolve(null));

      mattermostMessageStub = sinon.stub(betagouv, 'sendInfoToChat')
      const mattermostUsers : MattermostUser[] = [{
        username: 'toto'
      }] as MattermostUser[]
      mattermostSearchUser = sinon.stub(mattermost, 'searchUsers').returns(Promise.resolve(mattermostUsers))

      // reset the test user to avoid duplicates in db
      knex('users')
        .where('secondary_email', 'test@example.com')
        .orWhere('primary_email', 'test@example.com')
        .del()
        .then();

      done();
    });

    afterEach(() => {
      getGithubMasterSha.restore();
      createGithubBranch.restore();
      createGithubFile.restore();
      makeGithubPullRequest.restore();
      sendEmailStub.restore();
      isPublicServiceEmailStub.restore();
      mattermostMessageStub.restore();
      searchCommuneStub.restore();
      mattermostSearchUser.restore();
    });

    it('should not call Github API if a mandatory field is missing', async () => {
      await chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          // firstName: 'missing',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          memberType: 'beta',
        })
      getGithubMasterSha.called.should.be.false;
      createGithubBranch.called.should.be.false;
      createGithubFile.called.should.be.false;
      makeGithubPullRequest.called.should.be.false;
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
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          memberType: 'beta',
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
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
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          memberType: 'beta',
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
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
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          memberType: 'beta',
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
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
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          memberType: 'beta',
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if domaine missing', (done) => {
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
          referent: 'membre.actif',
          email: 'test@example.com',
          memberType: 'beta',
          // domaine missing
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if referent missing', (done) => {
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
          domaine: 'Coaching',
          email: 'test@example.com',
          memberType: 'beta',
          // referent missing
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if domaine has wrong value', (done) => {
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
          domaine: 'Wrongvalue',
          referent: 'membre.actif',
          email: 'test@example.com',
          memberType: 'beta',
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
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
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          website: 'example.com/me',
          memberType: 'beta',
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
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
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          github: 'https://github.com/betagouv',
          memberType: 'beta',
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
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
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          github: 'github.com/betagouv',
          memberType: 'beta',
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should not call Github API if email is not public email and isEmailBetaAsked false', (done) => {
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
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          memberType: 'beta',
          isEmailBetaAsked: false
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should fail if the user is already registered', (done) => {
      knex('users').insert({
        firstName: 'Férnàndáô',
        lastName: 'Úñíbe',
        role: 'Dev',
        start: '2020-01-01',
        end: '2021-01-01',
        status: 'Independant',
        domaine: 'Coaching',
        referent: 'membre.actif',
        email: 'test@example.com',
        github: 'github.com/betagouv',
        memberType: 'beta',
      }).then();

      chai
        .request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          github: 'github.com/betagouv',
          memberType: 'beta',
        })
        .end((err, res) => {
          getGithubMasterSha.called.should.be.false;
          createGithubBranch.called.should.be.false;
          createGithubFile.called.should.be.false;
          makeGithubPullRequest.called.should.be.false;
          done();
        });
    });

    it('should call Github API if mandatory fields are present', async () => {
      const res = await chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Férnàndáô',
          lastName: 'Úñíbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          isEmailBetaAsked: true,
          memberType: 'beta',
      })
      getGithubMasterSha.calledOnce.should.be.true;
      createGithubBranch.calledOnce.should.be.true;
      createGithubFile.calledOnce.should.be.true;
      makeGithubPullRequest.calledOnce.should.be.true;
    });

    it('should call Github API if email is public email', (done) => {
      isPublicServiceEmailStub.returns(Promise.resolve(true));
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
          domaine: 'Coaching',
          referent: 'membre.actif',
          email: 'test@example.com',
          memberType: 'beta',
          isEmailBetaAsked: false
        })
        .end((err, res) => {
          console.log('Github api email', getGithubMasterSha.args)
          getGithubMasterSha.calledOnce.should.be.true;
          createGithubBranch.calledOnce.should.be.true;
          createGithubFile.calledOnce.should.be.true;
          makeGithubPullRequest.calledOnce.should.be.true;
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
          domaine: 'Coaching',
          website: 'https://example.com/me',
          email: 'test@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
        .end((err, res) => {
          const sha = createGithubBranch.args[0][0];
          sha.should.equal('sha');
          done();
        });
    });

    it('branch name should not contain accents or special characters', async() => {
      await chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Raphaël Férnàndáô',
          lastName: 'Úñíïbe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          domaine: 'Coaching',
          email: 'test-membre@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
      const branch = createGithubBranch.args[0][1];
      branch.should.contain('author-raphael-fernandao-uniibe-');
    });

    it('filename should handle multiple spaces gracefully', async () => {
      await chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Jean   .  Jacques\'    .',
          lastName: '    Dupont    ',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          domaine: 'Coaching',
          email: 'jean-jacques@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
        const path1 = createGithubFile.args[0][0];
        path1.should.contain('jean.jacques.dupont.md');
    });

    it('filename should handle hyphen gracefully', async () => {
        const res = await chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Jean-Claude\'    .',
          lastName: '    Dupont    ',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          domaine: 'Coaching',
          email: 'jean-claude@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
        const path2 = createGithubFile.args[0][0];
        path2.should.contain('jean-claude.dupont.md');
    });

    it('PR title should contain the referent', (done) => {
      chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'Diférnàndáô',
          lastName: 'Úñíbe',
          referent: 'John Doe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          domaine: 'Coaching',
          email: 'difernandao@example.com',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
        .end((err, res) => {
          const prTitle = makeGithubPullRequest.args[0][1];
          prTitle.should.contain('Référent : John Doe.');
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
          domaine: 'Coaching',
          email: 'renedherblay@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
        .end((err, res) => {
          const path = createGithubFile.args[0][0];
          path.should.contain('rene.d.herblay.d.aramitz.md');
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
          domaine: 'Coaching',
          email: 'renedeaulbadia@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
        .end((err, res) => {
          const path = createGithubFile.args[0][0];
          path.should.contain('rene.l.d.a.md');
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
          domaine: 'Coaching',
          email: 'renearamitzof@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.contain('/onboardingSuccess/');
          done();
        });
    });

    it('should store in database the secondary email, primary_email and status', (done) => {
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
          domaine: 'Coaching',
          email: 'johndoe@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
        .then(() => knex('users').where({ username: 'john.doe' }))
        .then((dbRes) => {
          dbRes.length.should.equal(1);
          dbRes[0].secondary_email.should.equal(`johndoe@example.com`);
          dbRes[0].primary_email_status.should.equal(EmailStatusCode.EMAIL_UNSET);
        })
        .then(done)
        .catch(done);
    });

    it('should store the primary_email_status as active if no beta email and email is public service', (done) => {
      isPublicServiceEmailStub.returns(Promise.resolve(true));
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
          domaine: 'Coaching',
          email: 'test@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: false,
        })
        .then(() => knex('users').where({ username: 'john.doe' }))
        .then((dbRes) => {
          dbRes.length.should.equal(1);
          dbRes[0].primary_email.should.equal(`test@example.com`);
          dbRes[0].primary_email_status.should.equal(EmailStatusCode.EMAIL_ACTIVE);
        })
        .then(done)
        .catch(done);
    });

    it('DB conflicts in newcomer secondary email should be treated as an update', async () => {
      await knex('users')
        .where({
          username: 'john.doe',
        })
        .update({
          secondary_email: 'test@example.com',
        })
      await chai.request(app)
        .post('/onboarding')
        .type('form')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          role: 'Dev',
          start: '2020-01-01',
          end: '2021-01-01',
          status: 'Independant',
          domaine: 'Coaching',
          email: 'updated@example.com',
          referent: 'membre.actif',
          memberType: 'beta',
          isEmailBetaAsked: true,
        })
        const dbRes = await knex('users').where({ username: 'john.doe' })
        dbRes.length.should.equal(1);
        dbRes[0].secondary_email.should.equal('updated@example.com');
        await knex('users').where({
          username: 'john.doe',
        }).update({
          secondary_email: null,
        })
    });
  });
});
