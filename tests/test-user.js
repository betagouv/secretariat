const chai = require('chai');
const app = require('../index');
const utils = require('./utils.js');
const nock = require('nock');


describe("User", () => {
  describe("GET /users/:name unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .get('/users/jenexistepas.test2')
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
        .get('/users/jenexistepas.test2')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        })
    });
    it("should include the user's information", (done) => {
      chai.request(app)
        .get('/users/jenexistepas.test2')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('Nom: Je n&#39;existe pas 2')
          res.text.should.include('Date de début: 2016-11-03')
          res.text.should.include('Date de fin: 2050-10-30')
          res.text.should.include('Employeur: independent&#x2F;octo')
          res.text.should.include('Github : test-github')
          done();
        })
    });
    it("should include an email creation form for email-less users", (done) => {
      chai.request(app)
        .get('/users/jenexistepas.test2')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('<form action="/users/jenexistepas.test2/email" method="POST">')
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
        .get('/users/jenexistepas.test2')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('Seul jenexistepas.test2 peut créer ou modifier ce compte email')
          done();
        })
    });
    it("should show the user an email redirection form", (done) => {
      chai.request(app)
        .get('/users/jenexistepas.test')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('<form action="/users/jenexistepas.test/redirections" method="POST">')
          done();
        })
    });
    it("should not show an email redirection form to other users", (done) => {
      chai.request(app)
        .get('/users/jenexistepas.test2')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('Seul jenexistepas.test2 peut créer ou modifier les redirections')
          res.text.should.not.include('<form action="/users/jenexistepas.test2/redirections" method="POST">')
          done();
        })
    });
  });

  describe("POST /users/:id/email unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .post('/users/jenexistepas.test2/email')
        .type('form')
        .send({
          '_method': 'POST',
          'to_email': 'test@test.com'
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
        .persist()

      ovhEmailNock.on('request', () => { return })

      chai.request(app)
        .post('/users/jenexistepas.test2/email')
        .set('Cookie', `token=${utils.getJWT()}`)
        .type('form')
        .send({ to_email: 'test@test.com' })
        .end((err, res) => {
          ovhEmailNock._eventsCount.should.equal(1)
          done();
        });
    })
  })

  describe("POST /users/:id/redirections unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .post('/users/jenexistepas.test2/redirections')
        .type('form')
        .send({
          'to_email': 'test@test.com'
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
        .persist()

      ovhRedirectionNock.on('request', () => { return })

      chai.request(app)
        .post('/users/jenexistepas.test2/redirections')
        .set('Cookie', `token=${utils.getJWT()}`)
        .type('form')
        .send({ to_email: 'test@test.com' })
        .end((err, res) => {
          ovhRedirectionNock._eventsCount.should.equal(1)
          done();
        });
    })
  })
});
