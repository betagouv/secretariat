const chai = require('chai');
const app = require('../index');
const utils = require('./utils.js');
const nock = require('nock')


describe("Admin", () => {
  describe("GET /admin unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .get('/admin')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });

  describe("GET /admin authenticated", () => {
    it("should return a valid page", (done) => {
      chai.request(app)
        .get('/admin')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});

