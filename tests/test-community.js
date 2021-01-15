const chai = require('chai');
const nock = require('nock');

const app = require('../index');
const utils = require('./utils.js');
const knex = require('../db');

describe('Community', () => {
  describe('GET /community unauthenticated', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .get('/community')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.include('/login');
          res.headers.location.should.equal('/login?next=/community');
          done();
        });
    });
  });

  describe('GET /community authenticated', () => {
    afterEach((done) => {
      knex('users').truncate()
        .then(() => done());
    });

    it('should return a valid page', (done) => {
      chai.request(app)
        .get('/community')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('should return a valid page for an existing user', (done) => {
      chai.request(app)
        .get('/community/membre.parti')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });

    it('should redirect to community page if an unknown user is specified', (done) => {
      chai.request(app)
        .get('/community/membre.unknown')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/community');
          done();
        });
    });

    it('should redirect to account if the user is the current user', (done) => {
      chai.request(app)
        .get('/community/membre.actif')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/account');
          done();
        });
    });

    it("should show the user's information if the user exists", (done) => {
      chai.request(app)
        .get('/community/membre.parti')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include('Membre Parti');
          res.text.should.include('du 03/11/2016');
          res.text.should.include('au 30/10/2050');
          res.text.should.include('independent/octo');
          res.text.should.include('test-github');
          done();
        });
    });

    it('should show the email creation form for email-less users', (done) => {
      chai.request(app)
        .get('/community/membre.parti')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include('action="/users/membre.parti/email" method="POST"');
          done();
        });
    });

    it('should prefill the secondary email for email-less users', (done) => {
      knex('users')
        .insert({
          username: 'membre.parti',
          secondary_email: 'perso@example.com',
        }).then(() => {
          chai.request(app)
            .get('/community/membre.parti')
            .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
            .end((err, res) => {
              res.text.should.include('<input value="perso@example.com" name="to_email"');
              done();
            });
        });
    });

    it('should not show the email creation form for users with existing emails', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, { description: '' });

      utils.mockUsers();
      utils.mockOvhRedirections();
      utils.mockOvhTime();

      chai.request(app)
        .get('/community/membre.parti')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.not.include('action="/users/membre.parti/email" method="POST">');
          done();
        });
    });

    it('should not show the email creation form for users expired', (done) => {
      nock.cleanAll();

      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, { description: '' });

      utils.mockUsers();
      utils.mockOvhRedirections();
      utils.mockOvhTime();

      chai.request(app)
        .get('/community/membre.expire')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.include('Contrat de Membre Expiré arrivé à expiration');
          res.text.should.not.include('action="/users/membre.expire/email" method="POST">');
          res.text.should.not.include('action="/users/membre.expire/password" method="POST">');
          res.text.should.include('Le compte membre.expire est expiré.');
          done();
        });
    });

    it('should not show marrainage for expired users', (done) => {
      chai.request(app)
        .get('/community/membre.expire')
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .end((err, res) => {
          res.text.should.not.include("L'accueillir ?");
          res.text.should.not.include('Chercher un·e marrain·e');
          res.text.should.include("La fonction marrainage n'est pas disponible pour les comptes expirés.");
          done();
        });
    });
  });
});
