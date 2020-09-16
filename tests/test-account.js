const chai = require('chai');
const app = require('../index');
const utils = require('./utils.js');
const nock = require('nock')


describe("Account", () => {
  describe("GET /account unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .get('/account')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });

  describe("GET /account authenticated", () => {
    it("should return a valid page", (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});

