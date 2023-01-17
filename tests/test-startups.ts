import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '@/index';
import utils from './utils';
import * as UpdateGithubFile from '@/controllers/helpers/githubHelpers/updateGithubFile'
import sinon from 'sinon';
import * as betagouv from '@/betagouv';

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
    let startupInfosStub
    beforeEach(() => {
      updateAuthorGithubFileStub = sinon.stub(UpdateGithubFile, 'updateStartupGithubFile')
      updateAuthorGithubFileStub.returns(Promise.resolve({
        html_url: 'https://djkajdlskjad.com',
        number: 12151
      }))
      startupInfosStub = sinon.stub(betagouv.default, 'startupsInfos')
      startupInfosStub.returns(Promise.resolve([
        { "id"        : "a-dock"
        , "type"      : "startup"
        , "attributes":
            { "name"  : "A Dock"
            , "pitch" : "Simplifier l'accès aux données et démarches administratives du transport routier de marchandises"
            , "stats_url": "https://adock.beta.gouv.fr/stats"
            , "link": "https://adock.beta.gouv.fr"
            , "repository": "https://github.com/MTES-MCT/adock-api"
            , "events": [
                
                ]
            , "phases": [
                
                    { "name": "investigation", "start": "2018-01-08", "end": "2018-07-01"},
                
                    { "name": "construction", "start": "2018-07-01", "end": "2019-01-23"},
                
                    { "name": "acceleration", "start": "2019-01-23", "end": ""}
                
                ]
            }
        , "relationships":
            { "incubator":
                { "data": { "type": "incubator", "id": "mtes" }
                }
            }
        }])
      )
    })

    afterEach(() => {
      updateAuthorGithubFileStub.restore()
      startupInfosStub.restore()
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
