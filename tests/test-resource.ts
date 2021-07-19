import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../src/index';
import utils from './utils';

chai.use(chaiHttp);

describe('Resource', () => {
  describe('GET /resources unauthenticated', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .get('/resources')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.include('/login');
          res.header.location.should.equal('/login?next=/resources');
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
