const chai = require('chai');
const app = require('../index');
const utils = require('./utils.js');
const nock = require('nock');


describe("User", () => {
  describe("GET /users/:name unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .get('/users/utilisateur.parti')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal("/login");
          done();
        });
    });
  });

  describe("GET /users authenticated", () => {
    it("should return a valid page", (done) => {
      chai.request(app)
        .get('/users/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        })
    });
    it("should include the user's information", (done) => {
      chai.request(app)
        .get('/users/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('Nom: Utilisateur Parti')
          res.text.should.include('Date de début: 2016-11-03')
          res.text.should.include('Date de fin: 2050-10-30')
          res.text.should.include('Employeur: independent&#x2F;octo')
          res.text.should.include('Github : test-github')
          done();
        })
    });
    it("should include an email creation form for email-less users", (done) => {
      chai.request(app)
        .get('/users/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('<form action="/users/utilisateur.parti/email" method="POST">')
          done();
        })
    });
    it("should not include an email creation form for users with existing emails", (done) => {
      nock.cleanAll()

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, { description: '' })

      utils.mockUsers()
      utils.mockOvhRedirections()
      utils.mockOvhTime()

      chai.request(app)
        .get('/users/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('Seul utilisateur.parti peut créer ou modifier ce compte email')
          done();
        })
    });
    it("should show the user an email redirection form", (done) => {
      chai.request(app)
        .get('/users/utilisateur.actif')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('<form action="/users/utilisateur.actif/redirections" method="POST">')
          done();
        })
    });
    it("should not show an email redirection form to other users", (done) => {
      chai.request(app)
        .get('/users/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('Seul utilisateur.parti peut créer ou modifier les redirections')
          res.text.should.not.include('<form action="/users/utilisateur.parti/redirections" method="POST">')
          done();
        })
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
          res.headers.location.should.equal("/login");
          done();
        });
    })
  })

  describe("POST /users/:id/email authenticated", () => {
    it("should ask OVH to create an email", (done) => {
      let ovhEmailNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.parti/email')
        .set('Cookie', `token=${utils.getJWT()}`)
        .type('form')
        .send({ to_email: 'test@example.com' })
        .end((err, res) => {
          ovhEmailNock.isDone().should.be.true
          done();
        });
    })
  })

  describe("POST /users/:id/redirections unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .post('/users/utilisateur.parti/redirections')
        .type('form')
        .send({
          'to_email': 'test@example.com'
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal("/login");
          done();
        });
    })
  })

  describe("POST /users/:id/redirections authenticated", () => {
    it("should ask OVH to create a redirection", (done) => {
      let ovhRedirectionNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.actif/redirections')
        .set('Cookie', `token=${utils.getJWT()}`)
        .type('form')
        .send({ to_email: 'test@example.com' })
        .end((err, res) => {
          ovhRedirectionNock.isDone().should.be.true
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
          res.headers.location.should.equal("/login");
          done();
        });
    })
  })

  describe("POST /users/:id/redirections/:email/delete authenticated", () => {
    it("should ask OVH to delete a redirection", (done) => {

      let ovhRedirectionNock = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200)

      chai.request(app)
        .post('/users/utilisateur.actif/redirections/test-2@example.com/delete')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          ovhRedirectionNock.isDone().should.be.true
          done();
        });
    })
  })
});
