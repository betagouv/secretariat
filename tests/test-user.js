const chai = require('chai');
const nock = require('nock');
const sinon = require('sinon');
const config = require('../config');
const app = require('../index');
const utils = require('./utils.js');
const knex = require('../db');
const controllerUtils = require('../controllers/utils');
const { createEmailAddresses } = require('../schedulers/emailCreationScheduler');

describe('User', () => {
  describe('POST /users/:username/email unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.parti/email')
        .type('form')
        .send({
          _method: 'POST',
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });
  
  
  describe('POST /users/:username/email authenticated', () => {
    it('should ask OVH to create an email', (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/email')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.true;
          done();
        });
    });

    it('should not allow email creation from delegate if email already exists', (done) => {
      // For this case we need to reset the basic nocks in order to return
      // a different response to indicate that membre.nouveau has an
      // existing email already created.
      utils.cleanMocks();
      utils.mockUsers();
      utils.mockSlack();
      utils.mockOvhTime();
      utils.mockOvhRedirections();

      // We return an email for membre.nouveau to indicate he already has one
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, {
          accountName: 'membre.nouveau',
          email: 'membre.nouveau@example.com',
        });

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/email')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it("should not allow email creation from delegate if github file doesn't exist", (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.sans.fiche/email')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it('should not allow email creation from delegate if user has expired', (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/email')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it('should not allow email creation from delegate if delegate has expired', (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/email')
        .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/redirections unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.parti/redirections')
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe('POST /users/:username/redirections authenticated', () => {
    it('should ask OVH to create a redirection', (done) => {
      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/redirections')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhRedirectionCreation.isDone().should.be.true;
          done();
        });
    });

    it('should not allow redirection creation from delegate', (done) => {
      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/redirections')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhRedirectionCreation.isDone().should.be.false;
          done();
        });
    });

    it('should not allow redirection creation from expired users', (done) => {
      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/redirections')
        .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
        .type('form')
        .send({
          to_email: 'test@example.com',
        })
        .end((err, res) => {
          ovhRedirectionCreation.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/redirections/:email/delete unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.parti/redirections/test@example.com/delete')
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe('POST /users/:username/redirections/:email/delete authenticated', () => {
    it('should ask OVH to delete a redirection', (done) => {
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.true;
          done();
        });
    });

    it('should not allow redirection deletion from delegate', (done) => {
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });

    it('should not allow redirection deletion from expired users', (done) => {
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/password unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.actif/password')
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
    it('should not allow a password change', (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/password')
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/password unauthenticated', () => {
    it('should redirect to user page', (done) => {
      chai.request(app)
        .post('/users/membre.actif/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/community/membre.actif');
          done();
        });
    });
    it('should perform a password change', (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.true;
          done();
        });
    });
    it('should not allow a password change from delegate', (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.nouveau/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
    it('should not allow a password change from expired user', (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/password')
        .set('Cookie', `token=${utils.getJWT('membre.expire')}`)
        .type('form')
        .send({
          new_password: 'Test_Password_1234',
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
    it('should not allow a password shorter than 9 characters', (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: '12345678',
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
    it('should not allow a password longer than 30 characters', (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/password')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .type('form')
        .send({
          new_password: '1234567890123456789012345678901',
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
  });

  describe('POST /users/:username/email/delete unauthenticated', () => {
    it('should return an Unauthorized error', (done) => {
      chai.request(app)
        .post('/users/membre.parti/email/delete')
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });
  });

  describe('POST /users/:username/redirections/:email/delete authenticated', () => {
    it('should ask OVH to delete the email account', (done) => {
      const ovhEmailDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/account\/membre.expire/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhEmailDeletion.isDone().should.be.true;
          done();
        });
    });

    it('should ask OVH to delete all redirections', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection/)
        .query((x) => x.from || x.to)
        .reply(200, ['123123'])
        .persist();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200, {
          id: '123123',
          from: `membre.expire@${config.domain}`,
          to: 'perso@example.ovh',
        }).persist();

      utils.mockUsers();
      utils.mockOvhTime();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      utils.mockSlack();

      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.expire/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.true;
          done();
        });
    });

    it('should not allow email deletion for active users', (done) => {
      const ovhEmailDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/account\/membre.expire/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhEmailDeletion.isDone().should.be.false;
          done();
        });
    });

    it('should not allow redirection deletion for another user if active', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection/)
        .query((x) => x.from || x.to)
        .reply(200, ['123123'])
        .persist();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200, {
          id: '123123',
          from: `membre.actif@${config.domain}`,
          to: 'perso@example.ovh',
        }).persist();

      utils.mockUsers();
      utils.mockOvhTime();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      utils.mockSlack();

      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.nouveau')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });

    it('should allow redirection deletion for requester even if active', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection/)
        .query((x) => x.from || x.to)
        .reply(200, ['123123'])
        .persist();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200, {
          id: '123123',
          from: `membre.actif@${config.domain}`,
          to: 'perso@example.ovh',
        }).persist();

      utils.mockUsers();
      utils.mockOvhTime();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      utils.mockSlack();

      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200);

      chai.request(app)
        .post('/users/membre.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.true;
          done();
        });
    });
  });

  describe('cronjob', () => {
    before(async () => {
      await knex('users').truncate();
      await knex('marrainage').truncate();
    });

    beforeEach((done) => {
      this.sendEmailStub = sinon.stub(controllerUtils, 'sendMail').returns(true);
      done();
    });

    afterEach(async () => {
      await knex('users').truncate();
      await knex('marrainage').truncate();
      this.sendEmailStub.restore();
    });

    it('should create missing email accounts and marrainage request if start date < 2 months', async () => {
      utils.cleanMocks();
      const url = process.env.USERS_API || 'https://beta.gouv.fr'; // can't replace with config.usersApi ?
      console.log([
        {
          id: 'utilisateur.nouveau',
          fullname: 'Utilisateur Nouveau',
          missions: [
            {
              start: new Date().toISOString().split('T')[0],
            },
          ],
        },
      ]);
      const test = nock(url)
        .get((uri) => uri.includes('authors.json'))
        .reply(200, [
          {
            id: 'utilisateur.actif',
            fullname: 'Utilisateur Actif',
            missions: [
              {
                start: '2016-11-03',
                status: 'independent',
                employer: 'octo',
              },
            ],
          },
          {
            id: 'utilisateur.nouveau',
            fullname: 'Utilisateur Nouveau',
            missions: [
              {
                start: new Date().toISOString().split('T')[0],
              },
            ],
          },
        ])
        .persist();
      utils.mockSlack();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();
      const ovhEmailCreation = nock(/.*ovh.com/)
      .post(/^.*email\/domain\/.*\/account/)
      .reply(200);
      let marrainage = await knex('marrainage').where({ username: 'utilisateur.nouveau' }).select();
      marrainage.length.should.equal(0);
      await knex('users').insert({
        username: 'utilisateur.nouveau',
        secondary_email: 'utilisateur.nouveau.perso@example.com',
      });
      await createEmailAddresses();
      test.isDone().should.be.true;
      ovhEmailCreation.isDone().should.be.true;
      this.sendEmailStub.calledTwice.should.be.true;
      marrainage = await knex('marrainage').where({ username: 'utilisateur.nouveau' }).select();
      marrainage.length.should.equal(1);
      marrainage[0].username.should.equal('utilisateur.nouveau');
      marrainage[0].last_onboarder.should.not.be.null;
    });

    it('should create missing email accounts but not marrainage request if start date > 2 months', async () => {
      utils.cleanMocks();
      const today = new Date();
      const startDate = new Date(today.setMonth(today.getMonth() + 3));
      const url = process.env.USERS_API || 'https://beta.gouv.fr'; // can't replace with config.usersApi ?
      nock(url)
        .get((uri) => uri.includes('authors.json'))
        .reply(200, [
          {
            id: 'utilisateur.actif',
            fullname: 'Utilisateur Actif',
            missions: [
              {
                start: '2016-11-03',
                status: 'independent',
                employer: 'octo',
              },
            ],
          },
          {
            id: 'utilisateur.nouveau',
            fullname: 'Utilisateur Nouveau',
            missions: [
              {
                start: startDate.toISOString().split('T')[0],
              },
            ],
          },
        ])
        .persist();
      utils.mockSlack();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      let marrainage = await knex('marrainage').where({ username: 'utilisateur.nouveau' }).select();
      marrainage.length.should.equal(0);
      await knex('users').insert({
        username: 'utilisateur.nouveau',
        secondary_email: 'utilisateur.nouveau.perso@example.com',
      });
      await createEmailAddresses();
      ovhEmailCreation.isDone().should.be.true;
      this.sendEmailStub.calledOnce.should.be.true;
      marrainage = await knex('marrainage').where({ username: 'utilisateur.nouveau' }).select();
      marrainage.length.should.equal(0);
    });

    it('should create missing email accounts and not send error even if no marrainage possible', async () => {
      utils.cleanMocks();
      const url = process.env.USERS_API || 'https://beta.gouv.fr'; // can't replace with config.usersApi ?
      nock(url)
        .get((uri) => uri.includes('authors.json'))
        .reply(200, [
          {
            id: 'utilisateur.nouveau',
            fullname: 'Utilisateur Nouveau',
            missions: [
              {
                start: new Date().toISOString().split('T')[0],
              },
            ],
          },
        ])
        .persist();
      utils.mockSlack();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      utils.mockOvhUserEmailInfos();
      utils.mockOvhAllEmailInfos();

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);
      const consoleSpy = sinon.spy(console, 'warn');

      let marrainage = await knex('marrainage').where({ username: 'utilisateur.nouveau' }).select();
      marrainage.length.should.equal(0);
      await knex('users').insert({
        username: 'membre.nouveau',
        secondary_email: 'membre.nouveau.perso@example.com',
      });
      await createEmailAddresses();
      ovhEmailCreation.isDone().should.be.true;
      consoleSpy.firstCall.args[0].message.should.equal('Aucun·e marrain·e n\'est disponible pour le moment');
      this.sendEmailStub.calledTwice.should.be.true;
      marrainage = await knex('marrainage').where({ username: 'utilisateur.nouveau' }).select();
      marrainage.length.should.equal(0);
      console.warn.restore();
    });

    it('should not create email accounts if already created', (done) => {
      // For this case we need to reset the basic nocks in order to return
      // a different response to indicate that newcomer.test has an
      // email address
      utils.cleanMocks();
      utils.mockUsers();
      utils.mockSlack();
      utils.mockOvhTime();
      utils.mockOvhRedirections();

      // We return an email for membre.nouveau to indicate he already has one
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, {
          accountName: 'membre.nouveau',
          email: 'membre.nouveau@example.com',
        });

      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      knex('users').insert({
        username: 'membre.nouveau',
        secondary_email: 'membre.nouveau.perso@example.com',
      }).then(async () => {
        await createEmailAddresses();
        ovhEmailCreation.isDone().should.be.false;
        this.sendEmailStub.notCalled.should.be.true;
        done();
      });
    });

    it('should not create email accounts if we dont have the secondary email', (done) => {
      const ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      knex('users').insert({
        username: 'membre.nouveau',
      }).then(async () => {
        await createEmailAddresses();
        ovhEmailCreation.isDone().should.be.false;
        this.sendEmailStub.notCalled.should.be.true;
        done();
      });
    });
  });
});
