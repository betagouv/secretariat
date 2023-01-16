import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '@/index';
import utils from './utils';
import * as UpdateGithubFile from '@/controllers/helpers/githubHelpers/updateGithubFile'
import sinon from 'sinon';

chai.use(chaiHttp);


describe('Startup page', () => {
  describe('GET /startups unauthenticated', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .get('/admin')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.include('/login');
          res.header.location.should.equal('/login?next=/admin');
          done();
        });
    });
  });

  describe('GET /startups authenticated', () => {
    it('should return a valid page', (done) => {
      chai.request(app)
        .get('/startups')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });


  describe('post /startups/:startup/info-form unauthenticated', () => {
    it('should redirect to login', async () => {
      const res = await chai.request(app)
        .post(`/startups/a-dock/info-form`)
        .redirects(0)
          res.should.have.status(401);
    });
  });

  describe('post /startups/:startup/info-form authenticated', () => {
    let updateAuthorGithubFileStub
    beforeEach(() => {
      updateAuthorGithubFileStub = sinon.stub(UpdateGithubFile, 'updateStartupGithubFile')
      updateAuthorGithubFileStub.returns(Promise.resolve({
        html_url: 'https://djkajdlskjad.com',
        number: 12151
      }))
    })

    afterEach(() => {
      updateAuthorGithubFileStub.restore()
    })

    it('should not work if phase is not valid', async () => {
      const res = await chai.request(app)
        .post(`/startups/a-dock/info-form`)
        .send({
          phase: 'jhdkljasdjajda',
          date: (new Date()).toISOString()
        })
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .redirects(0)
        res.should.have.status(400);
        res.body.errors.phase[0].should.equal(`La phase n'as pas une valeur valide`)
    });

    it('should not work if date is not valid', async () => {
      const res = await chai.request(app)
        .post(`/startups/a-dock/info-form`)
        .send({
          phase: 'alumni',
          date: '2020/10/254'
        })
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .redirects(0)
        res.should.have.status(400);
        res.body.errors.date[0].should.equal(`La date n‘est pas valide`)
    });

    it('should work if both are valid', async () => {
      const res = await chai.request(app)
        .post(`/startups/a-dock/info-form`)
        .send({
          phase: 'alumni',
          date: (new Date()).toISOString()
        })
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .redirects(0)
        res.should.have.status(200);
    });
  });
});
