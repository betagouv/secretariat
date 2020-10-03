const chai = require('chai');
const app = require('../index');
const utils = require('./utils.js');
const nock = require('nock')


describe("Community", () => {
  describe("GET /community unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .get('/community')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });

  describe("GET /community authenticated", () => {
    it("should return a valid page", (done) => {
      chai.request(app)
        .get('/community')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should return a valid page for an existing user", (done) => {
      chai.request(app)
        .get('/community/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        })
    });

    it("should redirect to community page if an unknown user is specified", (done) => {
      chai.request(app)
        .get('/community/utilisateur.unknown')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/community');
          done();
        })
    });

    it("should redirect to account if the user is the current user", (done) => {
      chai.request(app)
        .get('/community/utilisateur.actif')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/account');
          done();
        })
    });

    it("should show the user's information", (done) => {
      chai.request(app)
        .get('/community/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.include('Utilisateur Parti')
          res.text.should.include('du 2016-11-03')
          res.text.should.include('au 2050-10-30')
          res.text.should.include('independent/octo')
          res.text.should.include('test-github')
          done();
        })
    });

    it("should show the email creation form for email-less users", (done) => {
      chai.request(app)
        .get('/community/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.include('action="/users/utilisateur.parti/email" method="POST">');
          res.text.should.not.include('action="/users/utilisateur.parti/password" method="POST">');
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
        .get('/community/utilisateur.parti')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.not.include('action="/users/utilisateur.parti/email" method="POST">');
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
        .get('/community/utilisateur.expire')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.not.include('action="/users/utilisateur.expire/email" method="POST">');
          res.text.should.not.include('action="/users/utilisateur.expire/password" method="POST">');
          res.text.should.include('Le compte utilisateur.expire est expiré.');
          done();
        })
    });

  });
});
