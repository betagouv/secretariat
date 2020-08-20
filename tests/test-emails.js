const chai = require('chai');
const nock = require('nock');
const app = require('../index');
const utils = require('./utils.js');
const { changePassword } = require('../betagouv');

describe('Emails', () => {
  describe('GET /emails unauthenticated', () => {
    it('should redirect to login', (done) => {
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

  describe('GET /emails authenticated', () => {
    it('should return a valid page', (done) => {
      chai.request(app)
        .get('/emails')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});
