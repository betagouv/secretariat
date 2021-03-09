const chai = require('chai');
const nock = require('nock');
const utils = require('./utils.js');
const app = require('../index');
const config = require('../config');
const knex = require('../db');

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
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.include('/login');
          res.headers.location.should.equal('/login?next=/account');
          done();
        });
    });
  });

  describe('GET /account authenticated', () => {
    // first render of template 'account' can be slow and exceed timeout this test may fail if timeout < 2000

    it('should return a valid page', (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('should show the logged user name', (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include('Membre Actif');
          done();
        });
    });

    it('should show the logged user employer', (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include('independent/octo');
          done();
        });
    });

    it("should include a link to OVH's webmail", (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include(`href="https://mail.ovh.net/roundcube/?_user=membre.actif@${config.domain}"`);
          done();
        });
    });

    it('should include a redirection creation form', (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include('action="/users/membre.actif/redirections" method="POST"');
          done();
        });
    });

    it('should not include a password modification if the email does not exist', (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.not.include('action="/users/membre.actif/password" method="POST"');
          res.text.should.not.include('Nouveau mot de passe POP/IMAP/SMTP');
          done();
        });
    });

    it('should include a password modification form id the email exists', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, { description: '' });

      utils.mockUsers();
      utils.mockOvhRedirections();
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include('action="/users/membre.actif/password" method="POST"');
          done();
        });
    });

    it("don't show reload button if last change is under 24h", (done) => {
      knex('marrainage').insert({
        username: 'membre.actif',
        last_onboarder: 'membre.peutimporte',
      })
      .then(() => {
        chai.request(app)
          .get('/account')
          .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
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
        last_updated: new Date(Date.now() - 24 * 3601 * 1000),
      })
      .then(() => {
        chai.request(app)
          .get('/account')
          .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
          .end((err, res) => {
            res.text.should.include('action="/marrainage/reload" method="POST"');
            done();
          });
      });
    });

    it('should display dates in french locale', (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include('du 03/11/2016');
          res.text.should.include('du 03/11/2016');
          done();
        });
    });
  });
});
