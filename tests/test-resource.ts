import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '@/index';
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
      nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/channels.*/)
      .reply(200, [
        {
          id: 265695,
          create_at: 0,
          "update_at": 0,
          "delete_at": 0,
          "team_id": "string",
          "type": "string",
        },
      ])
      nock(/.*mattermost.incubateur.net/)
      .get(/^.*api\/v4\/channels.*/)
      .reply(200, [
      ])
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
