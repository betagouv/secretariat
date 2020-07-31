const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../index');
const utils = require('./utils.js')

chai.use(chaiHttp);
chai.should();


describe("Users", () => {
  describe("GET /users unauthenticated", () => {
    it("should redirect to login", (done) => {
      chai.request(app)
        .get('/users')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.headers.location.should.equal('/login');
          done();
        });
    });
  });
  describe("GET /users authenticated", () => {
    it("should return a valid page", (done) => {
      chai.request(app)
        .get('/users')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        })
    });
    it("should show the search form", (done) => {
      chai.request(app)
        .get('/users')
        .set('Cookie', `token=${utils.getJWT()}`)
        .end((err, res) => {
          res.text.should.include('<form action="/users">')
          res.text.should.include('<input name="id"')
          res.text.should.include('<button>')
          done();
        })
    });
  });
});
