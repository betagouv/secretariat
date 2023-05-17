import chai from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import sinon from 'sinon';
import { Response } from 'superagent';
import config from '@config';
import knex from '@/db';
import app from '@/index';
import * as session from '@/helpers/session';
import * as searchCommune from '@/lib/searchCommune';
import utils from './utils';

chai.use(chaiHttp);

describe('Account', () => {
  afterEach((done) => {
    knex('marrainage').truncate()
      .then(() => done());
  });

  describe('GET /account unauthenticated', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .get('/account')
        .redirects(0)
        .end((err, res: Response) => {
          res.should.have.status(302);
          res.header.location.should.include('/login');
          res.header.location.should.equal('/login?next=/account');
          done();
        });
    });
  });

  describe('GET /account authenticated', () => {
    // first render of template 'account' can be slow and exceed timeout this test may fail if timeout < 2000
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
        .get('/account')
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('should show the logged user name membre actif', (done) => {
      chai.request(app)
        .get('/account')
        .end((err, res) => {
          getToken.called.should.be.true
          console.log(res.text)
          res.text.should.include('Membre Actif');
          done();
        });
    });

    it('should show the logged user employer', (done) => {
      chai.request(app)
        .get('/account')
        .end((err, res) => {
          res.text.should.include('independent/octo');
          done();
        });
    });

    it('should include a link to OVH\'s webmail', (done) => {
      chai.request(app)
        .get('/account')
        .end((err, res) => {
          res.text.should.include(`href="https://mail.ovh.net/roundcube/?_user=membre.actif@${config.domain}"`);
          done();
        });
    });

    it('should include a redirection creation form', (done) => {
      chai.request(app)
        .get('/account')
        .end((err, res) => {
          res.text.should.include('action="/users/membre.actif/redirections" method="POST"');
          done();
        });
    });

    it('should not include a password modification if the email does not exist', (done) => {
      chai.request(app)
        .get('/account')
        .end((err, res) => {
          res.text.should.not.include('action="/users/membre.actif/password" method="POST"');
          res.text.should.not.include('Nouveau mot de passe POP/IMAP/SMTP');
          done();
        });
    });

    it('should include a password modification form if the email exists', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, { description: '' });

      utils.mockUsers();
      utils.mockOvhUserResponder();
      utils.mockOvhRedirections();
      chai.request(app)
        .get('/account')
        .end((err, res) => {
          res.text.should.include('action="/users/membre.actif/password" method="POST"');
          done();
        });
    });

    it('don\'t show reload button if last change is under 24h', (done) => {
      knex('marrainage').insert({
        username: 'membre.actif',
        last_onboarder: 'membre.peutimporte'
      })
        .then(() => {
          chai.request(app)
            .get('/account')
            .end((err, res) => {
              res.text.should.not.include('action="/marrainage/reload" method="POST"');
              done();
            });
        });
    });

    it('show reload button if last change is after 24h', (done) => {
      knex('marrainage').insert({
        username: 'membre.actif',
        last_onboarder: 'membre.peutimporte',
        last_updated: new Date(Date.now() - 24 * 3601 * 1000)
      })
        .then(() => {
          chai.request(app)
            .get('/account')
            .end((err, res) => {
              res.text.should.include('action="/marrainage/reload" method="POST"');
              done();
            });
        });
    });

    it('should display dates in french locale', async () => {
      const res = await chai.request(app)
        .get('/account')
      res.text.should.include('2040-11-12');
    });

    it('should set email responder', (done) => {
      const createEmailResponder = nock(/.*ovh.com/)
      .post(/^.*email\/domain\/.*\/responder.*/) // <-> /email/domain/betagouv.ovh/responder/membre.actif
      .reply(200)
      chai.request(app)
        .post('/account/set_email_responder')
        .type('form')
        .send({
          from: '2020-01-01',
          to: '2021-01-01',
          content: 'Je ne serai pas la cette semaine'
        })
        .end((err, res) => {
          createEmailResponder.isDone().should.be.true
          done();
        });
    });

    it('should update email responder', (done) => {
      const updateEmailResponder = nock(/.*ovh.com/)
      .put(/^.*email\/domain\/.*\/responder\/+.+/) // <-> /email/domain/betagouv.ovh/responder/membre.actif
      .reply(200)
      chai.request(app)
        .post('/account/set_email_responder')
        .type('form')
        .send({
          method: 'update',
          from: '2020-01-01',
          to: '2021-01-01',
          content: 'Je ne serai pas la cette semaine'
        })
        .end((err, res) => {
          updateEmailResponder.isDone().should.be.true
          done();
        });
    });

    it('should update user info', async () => {
      const fetchCommuneDetailsStub = sinon.stub(searchCommune, 'fetchCommuneDetails').returns(Promise.resolve(null));
      await chai.request(app)
        .post('/account/info')
        .type('form')
        .send({
          gender: 'female',
          workplace_insee_code: '',
          tjm: 800,
          legal_status: 'AE'
        })
      const user = await knex('users').where({ 'username': 'membre.actif' }).first()
      user.gender.should.equal('female')
      user.tjm.should.equal(800)
      fetchCommuneDetailsStub.restore()
    });

    it('should update communication_email value', async() => {
      const username = 'membre.actif'
      await knex('users').update({ 
        communication_email: 'secondary',
        secondary_email: 'membre.nouveau@gmail.com'
      }).where({
        username,
      })
      await chai.request(app)
        .post(`/account/update_communication_email/`)
        .type('form')
        .send({
          communication_email: 'primary',
        });
      const dbNewRes = await knex('users').select().where({ username })
      dbNewRes.length.should.equal(1);
      dbNewRes[0].communication_email.should.equal('primary');
      try {
       await chai.request(app)
        .post(`/account/update_communication_email/`)
        .type('form')
        .send({
          communication_email: 'secondary',
        });
      } catch (e) {
        console.log(e)
      }
      const dbNewRes2 = await knex('users').select().where({ username })
      dbNewRes2.length.should.equal(1);
      dbNewRes2[0].communication_email.should.equal('secondary');
      await knex('users').where({ username }).update({
        secondary_email: ''
      })
    })
  });
});
