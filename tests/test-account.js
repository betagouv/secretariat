const chai = require('chai');
const utils = require('./utils.js');
const nock = require('nock');

const app = require('../index');
const config = require('../config');
const knex = require('../db');


describe("Account", () => {
  afterEach((done) => {
    knex('marrainage').truncate()
    .then(() => done())
  });
  
  describe("GET /account unauthenticated", () => {
    it("should redirect to login", (done) => {
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

  describe("GET /account authenticated", () => {
    it("should return a valid page", (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("should show the logged user name", (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.include('Utilisateur Actif')
          done();
        })
    });

    it("should show the logged user employer", (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.include('independent/octo')
          done();
        })
    });

    it("should include a link to OVH's webmail", (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.include(`href="https://mail.ovh.net/roundcube/?_user=utilisateur.actif@${config.domain}"`)
          done();
        })
    });

    it("should include a redirection creation form", (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.include('action="/users/utilisateur.actif/redirections" method="POST"')
          done();
        })
    });

    it("should include a password modification form", (done) => {
      chai.request(app)
        .get('/account')
        .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
        .end((err, res) => {
          res.text.should.include('action="/users/utilisateur.actif/password" method="POST"')
          done();
        })
    });
    
    it("don't show reload button if last change is under 24h", (done) => {
      knex('marrainage').insert({
        username: 'utilisateur.actif',
        last_onboarder: 'utilisateur.peutimporte'
      }).then(() => {
        chai.request(app)
          .get('/account')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .end((err, res) => {
            res.text.should.not.include('action="/marrainage/reload" method="POST"')
            done();
          })
      });
    });
    
    it("show reload button if last change is after 24h", (done) => {
      knex('marrainage').insert({
        username: 'utilisateur.actif',
        last_onboarder: 'utilisateur.peutimporte',
        last_updated: new Date(Date.now() - 24*3601*1000)
      }).then(() => {
        chai.request(app)
          .get('/account')
          .set('Cookie', `token=${utils.getJWT('utilisateur.actif')}`)
          .end((err, res) => {
            res.text.should.include('action="/marrainage/reload" method="POST"')
            done();
          })
      });
    });
  });
});
