const chai = require('chai');

const app = require('../src/index.ts');
const utils = require('./utils');

describe('Resource', () => {
  describe('GET /resources unauthenticated', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .get('/resources')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.include('/login');
          res.headers.location.should.equal('/login?next=/resources');
          done();
        });
    });
  });

  describe('GET /resources authenticated', () => {
    it('should return a valid page', (done) => {
      chai.request(app)
        .get('/resources')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});
