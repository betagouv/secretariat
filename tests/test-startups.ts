import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '@/index';
import utils from './utils';
import * as UpdateGithubCollectionEntry from '@/controllers/helpers/githubHelpers/updateGithubCollectionEntry'
import sinon from 'sinon';
import * as betagouv from '@/betagouv';
import routes from '@/routes/routes';
import * as session from '@/helpers/session';

chai.use(chaiHttp);

const base64Image = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII`
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
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })

    it('should return a valid page', (done) => {
      chai.request(app)
        .get('/startups')
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });


  describe('post /startups/:startup unauthenticated', () => {
    it('should redirect to login', async () => {
      const res = await chai.request(app)
        .post(routes.STARTUP_POST_INFO_UPDATE_FORM.replace(':startup','a-dock'))
        .redirects(0)
          res.should.have.status(401);
    });
  });

  describe('post /startups/:startup authenticated', () => {
    let getToken
    let updateStartupGithubFileStub
    let startupInfosStub
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
      updateStartupGithubFileStub = sinon.stub(UpdateGithubCollectionEntry, 'updateMultipleFilesPR')
      updateStartupGithubFileStub.returns(Promise.resolve({
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
      getToken.restore()
      updateStartupGithubFileStub.restore()
      startupInfosStub.restore()
    })

    it('should not work if phase is not valid', async () => {
      const res = await chai.request(app)
        .post(routes.STARTUP_POST_INFO_UPDATE_FORM.replace(':startup','a-dock'))
        .send({
          phase: 'jhdkljasdjajda',
          start: (new Date()).toISOString()
        })
        res.should.have.status(400);
    });

    it('should not work if date is not valid', async () => {
      const res = await chai.request(app)
        .post(routes.STARTUP_POST_INFO_UPDATE_FORM.replace(':startup','a-dock'))
        .send({
          phase: 'alumni',
          start: '2020/10/254'
        })
        res.should.have.status(400);
    });

    it('should update product if date and phase are valid', async () => {
      const res = await chai.request(app)
        .post(routes.STARTUP_POST_INFO_UPDATE_FORM.replace(':startup','a-dock'))
        .send({
          mission: 'lamissiondelastartup',
          text: 'la description de la startup',
          title: 'title de la se',
          phases: [
            {
              name: 'alumni',
              start: (new Date()).toISOString(),
            }
          ],
        })
        res.should.have.status(200);
    });

    it('should be able to update product text content', async () => {
      const res = await chai.request(app)
        .post(routes.STARTUP_POST_INFO_UPDATE_FORM.replace(':startup','a-dock'))
        .send({
          mission: 'lamissiondelastartup',
          title: 'title de la se',
          phases: [
            {
              name: 'alumni',
              start: (new Date()).toISOString(),
            }
          ],
          newSponsors: [{
            name: 'a sponsors',
            acronym: 'AS',
            type: 'operateur',
            domaine_ministeriel: 'culture'
          }],
          image: base64Image,
          text: 'test'
        })
        updateStartupGithubFileStub.args[0][1][0].content.should.equals('test')
        res.should.have.status(200);
    });
  });

  describe('post /startups/:startup/create-form authenticated', () => {
    let getToken
    let updateStartupGithubFileStub
    let startupInfosStub
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
      updateStartupGithubFileStub = sinon.stub(UpdateGithubCollectionEntry, 'updateMultipleFilesPR')
      updateStartupGithubFileStub.returns(Promise.resolve({
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
      getToken.restore()
      updateStartupGithubFileStub.restore()
      startupInfosStub.restore()
    })

    it('should not work if phase is not valid', async () => {
      const res = await chai.request(app)
        .post(routes.STARTUP_POST_INFO_CREATE_FORM)
        .send({
          phases: [{
            name: 'jhdkljasdjajda',
            start: (new Date()).toISOString()
          }]
        })
        res.should.have.status(400);
    });

    it('should not work if date is not valid', async () => {
      const res = await chai.request(app)
        .post(routes.STARTUP_POST_INFO_CREATE_FORM)
        .send({
          startup: 'nomdestartup',
          phases: [{
            name: 'alumni',
            start: '2020/10/254'
          }]          
        })
        res.should.have.status(400);
    });

    it('should create product if date and phase are valid', async () => {
      const res = await chai.request(app)
        .post(routes.STARTUP_POST_INFO_CREATE_FORM)
        .send({
          startup: 'nomdestartup',
          mission: 'lamissiondelastartup',
          text: 'la description de la startup',
          title: 'title de la se',
          contact: 'lamissiondelastartup@beta.gouv.fr',
          phases: [{
            name: 'alumni',
            start: (new Date()).toISOString()
          }],
          image: base64Image,
          newSponsors: [{
            name: 'a sponsors',
            acronym: 'AS',
            type: 'operateur',
            domaine_ministeriel: 'culture'
          }],
        })
        res.should.have.status(200);
    });
  });
});
