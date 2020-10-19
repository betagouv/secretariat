const chai = require('chai');
const nock = require('nock');
const config = require('../config');
const app = require('../index');
const utils = require('./utils.js');


describe("User", () => {

  describe("POST /users/:id/email unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .post('/users/utilisateur.parti/email')
        .type('form')
        .send({
          '_method': 'POST',
          'to_email': 'test@example.com'
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.include('/login');
          res.headers.location.should.equal('/login?next=/users/utilisateur.parti/email');
          done();
        });
    });
  });

  describe("POST /users/:id/email authenticated", () => {
    it("should ask OVH to create an email", (done) => {
      let ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.nouveau/email')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com'
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.true;
          done();
        });
    });

    it("should not allow email creation from delegate if email already exists", (done) => {

      // For this case we need to reset the basic nocks in order to return
      // a different response to indicate that utilisateur.nouveau has an
      // existing email already created.
      utils.cleanMocks();
      utils.mockUsers();
      utils.mockSlack();
      utils.mockOvhTime();
      utils.mockOvhRedirections();

      // We return an email for utilisateur.nouveau to indicate he already has one
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, {
          accountName: 'utilisateur.nouveau',
          email: 'utilisateur.nouveau@example.com'
        });

      let ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.nouveau/email')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com'
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it("should not allow email creation from delegate if github file doesn't exist", (done) => {

      let ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.sans.fiche/email')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com'
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it("should not allow email creation from delegate if user has expired", (done) => {
      let ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.expire/email')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com'
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

    it("should not allow email creation from delegate if delegate has expired", (done) => {
      let ovhEmailCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.nouveau/email')
        .set('Cookie', `token=${utils.getJWT('utilisateur.expire')}`)
        .type('form')
        .send({
          to_email: 'test@example.com'
        })
        .end((err, res) => {
          ovhEmailCreation.isDone().should.be.false;
          done();
        });
    });

  });

  describe("POST /users/:id/redirections unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .post('/users/utilisateur.parti/redirections')
        .type('form')
        .send({
          to_email: 'test@example.com'
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.include('/login');
          res.headers.location.should.equal('/login?next=/users/utilisateur.parti/redirections');
          done();
        });
    });
  });

  describe("POST /users/:id/redirections authenticated", () => {
    it("should ask OVH to create a redirection", (done) => {
      let ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.actif/redirections')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com'
        })
        .end((err, res) => {
          ovhRedirectionCreation.isDone().should.be.true;
          done();
        });
    });

    it("should not allow redirection creation from delegate", (done) => {
      let ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.nouveau/redirections')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          to_email: 'test@example.com'
        })
        .end((err, res) => {
          ovhRedirectionCreation.isDone().should.be.false;
          done();
        });
    });

    it("should not allow redirection creation from expired users", (done) => {
      let ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.expire/redirections')
        .set('Cookie', `token=${utils.getJWT('utilisateur.expire')}`)
        .type('form')
        .send({
          to_email: 'test@example.com'
        })
        .end((err, res) => {
          ovhRedirectionCreation.isDone().should.be.false;
          done();
        });
    });
  });

  describe("POST /users/:id/redirections/:email/delete unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .post('/users/utilisateur.parti/redirections/test@example.com/delete')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.include('/login');
          res.headers.location.should.equal('/login?next=/users/utilisateur.parti/redirections/test@example.com/delete');
          done();
        });
    });
  });

  describe("POST /users/:id/redirections/:email/delete authenticated", () => {
    it("should ask OVH to delete a redirection", (done) => {

      let ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.actif/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.true;
          done();
        });
    });

    it("should not allow redirection deletion from delegate", (done) => {
      let ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.nouveau/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });

    it("should not allow redirection deletion from expired users", (done) => {
      let ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.expire/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT('utilisateur.expire')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });
  });

  describe("POST /users/:id/password unauthenticated", () => {

    it("should redirect to login", (done) => {
      chai.request(app)
        .post('/users/utilisateur.actif/password')
        .type('form')
        .send({
          'new_password': 'Test_Password_1234'
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.include('/login');
          res.headers.location.should.equal('/login?next=/users/utilisateur.actif/password');
          done();
        });
    });
    it("should not allow a password change", (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.actif/password')
        .type('form')
        .send({
          'new_password': 'Test_Password_1234'
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
  });

  describe("POST /users/:id/password unauthenticated", (done) => {
    it("should redirect to user page", (done) => {
      chai.request(app)
        .post('/users/utilisateur.actif/password')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          'new_password': 'Test_Password_1234'
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/community/utilisateur.actif');
          done();
        });
    });
    it("should perform a password change", (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.actif/password')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          'new_password': 'Test_Password_1234'
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.true;
          done();
        });
    });
    it("should not allow a password change from delegate", (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.nouveau/password')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          'new_password': 'Test_Password_1234'
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
    it("should not allow a password change from expired user", (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.expire/password')
        .set('Cookie', `token=${utils.getJWT('utilisateur.expire')}`)
        .type('form')
        .send({
          'new_password': 'Test_Password_1234'
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
    it("should not allow a password shorter than 9 characters", (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.actif/password')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          'new_password': '12345678'
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
    it("should not allow a password longer than 30 characters", (done) => {
      this.ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      chai.request(app)
        .post('/users/utilisateur.actif/password')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .type('form')
        .send({
          'new_password': '1234567890123456789012345678901'
        })
        .end((err, res) => {
          this.ovhPasswordNock.isDone().should.be.false;
          done();
        });
    });
  });

  describe("POST /users/:id/email/delete unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .post('/users/utilisateur.parti/email/delete')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.include('/login');
          res.headers.location.should.equal('/login?next=/users/utilisateur.parti/email/delete');
          done();
        });
    });
  });

  describe("POST /users/:id/redirections/:email/delete authenticated", () => {
    it("should ask OVH to delete the email account", (done) => {

      let ovhEmailDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/account\/utilisateur.expire/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.expire/email/delete')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          ovhEmailDeletion.isDone().should.be.true;
          done();
        });
    });

    it("should ask OVH to delete all redirections", (done) => {

      nock.cleanAll()

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection/)
        .query(x => x.from || x.to)
        .reply(200, ['123123'])
        .persist()

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200, {
          "id": "123123",
          "from": `utilisateur.expire@${config.domain}`,
          "to": "perso@example.ovh"
        }).persist()

      utils.mockUsers()
      utils.mockOvhTime()
      utils.mockOvhUserEmailInfos()
      utils.mockOvhAllEmailInfos()
      utils.mockSlack()

      let ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.expire/email/delete')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.true;
          done();
        });
    });

    it("should not allow email deletion for active users", (done) => {

      let ovhEmailDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/account\/utilisateur.expire/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          ovhEmailDeletion.isDone().should.be.false;
          done();
        });
    });

    it("should not allow redirection deletion for another user if active", (done) => {

      nock.cleanAll()

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection/)
        .query(x => x.from || x.to)
        .reply(200, ['123123'])
        .persist()

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200, {
          "id": "123123",
          "from": `utilisateur.actif@${config.domain}`,
          "to": "perso@example.ovh"
        }).persist()

      utils.mockUsers()
      utils.mockOvhTime()
      utils.mockOvhUserEmailInfos()
      utils.mockOvhAllEmailInfos()
      utils.mockSlack()

      let ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('utilisateur.nouveau')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.false;
          done();
        });
    });

    it("should allow redirection deletion for requester even if active", (done) => {

      nock.cleanAll()

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection/)
        .query(x => x.from || x.to)
        .reply(200, ['123123'])
        .persist()

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200, {
          "id": "123123",
          "from": `utilisateur.actif@${config.domain}`,
          "to": "perso@example.ovh"
        }).persist()

      utils.mockUsers()
      utils.mockOvhTime()
      utils.mockOvhUserEmailInfos()
      utils.mockOvhAllEmailInfos()
      utils.mockSlack()

      let ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/123123/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.actif/email/delete')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          ovhRedirectionDeletion.isDone().should.be.true;
          done();
        });
    });
  });


});
