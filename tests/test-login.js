const chai = require('chai');

const app = require('../index');

describe('Login', () => {
  // describe("POST /login with user actif", () => {
  //   it("should render login with message", (done) => {
  //     utils.mockUsers();

  //     chai.request(app)
  //       .post('/login')
  //       .type('form')
  //       .send({
  //         id: 'membre.actif'
  //       })
  //       .end((err, res) => {
  //         res.should.have.status(200);
  //         res.text.should.include('Email de connexion envoyé pour membre.actif');
  //         done();
  //       });
  //   });
  // });

  describe('POST /login with next query param', () => {
    it('should keep the next query param', (done) => {
      chai.request(app)
        .post('/login?next=/users')
        .type('form')
        .send({
          id: undefined,
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login?next=/users');
          done();
        });
    });
  });

  describe('POST /login with user undefined', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          id: undefined,
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });

  describe('POST /login with user with accent', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          id: 'prénom.nom',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });

  describe('POST /login with user expiré', () => {
    it('should redirect to login', (done) => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send({
          id: 'membre.expire',
        })
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });
});
