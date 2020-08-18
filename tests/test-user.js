const chai = require('chai');
const nock = require('nock');

const app = require('../index');
const utils = require('./utils.js');


describe("User", () => {
  describe("GET /users/:id unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .get('/users/utilisateur.parti')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });

  describe("GET /users/:id authenticated", () => {
    it("should return a valid page for an existing user", (done) => {
      chai.request(app)
        .get('/users/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        })
    });
    it("should return a valid page even for an unknown user", (done) => {
      chai.request(app)
        .get('/users/utilisateur.unknown')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.text.should.include('Inexistante (nécessaire pour créer le compte mail)');
          res.text.should.not.include('<form action="/users/utilisateur.unknown/email" method="POST">');
          res.text.should.not.include('<form action="/users/utilisateur.unknown/password" method="POST">');
          res.text.should.not.include('<form action="/users/utilisateur.unknown/redirections" method="POST">')
          done();
        })
    });
    it("should show the user's information", (done) => {
      chai.request(app)
        .get('/users/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.include('Nom: Utilisateur Parti')
          res.text.should.include('Date de début: 2016-11-03')
          res.text.should.include('Date de fin: 2050-10-30')
          res.text.should.include('Employeur: independent/octo')
          res.text.should.include('test-github')
          done();
        })
    });
    describe("email form", () => {
      it("should show the email creation form for email-less users", (done) => {
        chai.request(app)
          .get('/users/utilisateur.parti')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .end((err, res) => {
            res.text.should.include('Inexistant');
            res.text.should.include('<form action="/users/utilisateur.parti/email" method="POST">');
            res.text.should.not.include('<form action="/users/utilisateur.parti/password" method="POST">');
            done();
          })
      });
      it("should not show the email creation form for users with existing emails", (done) => {
        nock.cleanAll()

        nock(/.*ovh.com/)
          .get(/^.*email\/domain\/.*\/account\/.*/)
          .reply(200, { description: '' })

        utils.mockUsers()
        utils.mockOvhRedirections()
        utils.mockOvhTime()

        chai.request(app)
          .get('/users/utilisateur.parti')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .end((err, res) => {
            res.text.should.not.include('<form action="/users/utilisateur.parti/email" method="POST">');
            res.text.should.include('Seul utilisateur.parti peut créer ou modifier ce compte email');
            done();
          })
      });
      it("should not show the email creation form for users expired", (done) => {
        nock.cleanAll()

        nock(/.*ovh.com/)
          .get(/^.*email\/domain\/.*\/account\/.*/)
          .reply(200, { description: '' })

        utils.mockUsers()
        utils.mockOvhRedirections()
        utils.mockOvhTime()

        chai.request(app)
          .get('/users/utilisateur.expire')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .end((err, res) => {
            res.text.should.not.include('<form action="/users/utilisateur.expire/email" method="POST">');
            res.text.should.not.include('<form action="/users/utilisateur.expire/password" method="POST">');
            res.text.should.include('Le compte utilisateur.expire est expiré.');
            done();
          })
      });
      it("should show the email password change form for current user with existing email", (done) => {
        nock.cleanAll()

        nock(/.*ovh.com/)
          .get(/^.*email\/domain\/.*\/account\/.*/)
          .reply(200, { description: '' })

        utils.mockUsers()
        utils.mockOvhRedirections()
        utils.mockOvhTime()

        chai.request(app)
          .get('/users/utilisateur.actif')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .end((err, res) => {
            res.text.should.not.include('<form action="/users/utilisateur.actif/email" method="POST">');
            res.text.should.include('<form action="/users/utilisateur.actif/password" method="POST">');
            done();
          })
      });
    });
    describe("email redirection form", () => {
      it("should show the email redirection form", (done) => {
        chai.request(app)
          .get('/users/utilisateur.actif')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .end((err, res) => {
            res.text.should.include('<form action="/users/utilisateur.actif/redirections" method="POST">');
            done();
          })
      });
      it("should not show the email redirection form to other users", (done) => {
        chai.request(app)
          .get('/users/utilisateur.parti')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .end((err, res) => {
            res.text.should.not.include('<form action="/users/utilisateur.parti/redirections" method="POST">')
            res.text.should.include('Seul utilisateur.parti peut créer ou modifier les redirections')
            done();
          })
      });
      it("should not show the email redirection form for users expired", (done) => {
        nock.cleanAll()

        nock(/.*ovh.com/)
          .get(/^.*email\/domain\/.*\/account\/.*/)
          .reply(200, { description: '' })

        utils.mockUsers()
        utils.mockOvhRedirections()
        utils.mockOvhTime()

        chai.request(app)
          .get('/users/utilisateur.expire')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .end((err, res) => {
            res.text.should.not.include('<form action="/users/utilisateur.expire/redirections" method="POST">');
            res.text.should.include('Le compte utilisateur.expire est expiré.');
            done();
          })
      });
    });
  });

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
          res.headers.location.should.equal('/login');
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

    it("should not allow email creation from third user if email already exists", (done) => {

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

    it("should not allow email creation from third user if github file doesn't exist", (done) => {

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

    it("should not allow email creation from third user if user has expired", (done) => {
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

    it("should not allow email creation from third user if third user has expired", (done) => {
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
          res.headers.location.should.equal('/login');
          done();
        });
    })
  })

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

    it("should not allow redirection creation from third user", (done) => {
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
    })
  })

  describe("POST /users/:id/redirections/:email/delete unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .post('/users/utilisateur.parti/redirections/test@example.com/delete')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    })
  })

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

    it("should not allow redirection deletion from third user", (done) => {
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
  })
});
