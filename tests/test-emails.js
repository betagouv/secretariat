const chai = require('chai');
const app = require('../index');
const utils = require('./utils.js');
const nock = require('nock')


describe("Emails", () => {
  describe("GET /emails unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .get('/emails')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });

  describe("GET /emails authenticated", () => {
    it("should return a valid page", (done) => {
      chai.request(app)
        .get('/emails')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});


describe("Expired emails", () => {

  describe("GET /emails/expired unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .get('/emails/expired')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });

  describe("GET /emails/expired authenticated", () => {
    it("should return a valid page", (done) => {
      chai.request(app)
        .get('/emails/expired')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should show expired users", (done) => {
        chai.request(app)
          .get('/emails/expired')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .redirects(0)
          .end((err, res) => {

            res.text.should.include('utilisateur.expire')
            res.text.should.include('hela.ghariani')
            res.text.should.include('nicolas.bouilleaud')
            res.text.should.include('stephane.legouffe')
            res.text.should.include('ishan.bhojwani')
            res.text.should.include('pierre.de_la_morinerie')

            res.text.should.not.include('utilisateur.parti')
            res.text.should.not.include('utilisateur.nouveau')
            res.text.should.not.include('julien.dauphant')
            res.text.should.not.include('loup.wolff')

            done();
          })
    });
  });
});
