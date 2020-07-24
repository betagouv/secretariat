const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index');
const utils = require('./utils.js')

chai.use(chaiHttp);
chai.should();

describe("Home", () => {
    describe("GET / unauthenticated", () => {
        it("should return valid page", (done) => {
            chai.request(app)
                .get('/')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    done();
                });
        });

        it("should include a login form", (done) => {
            chai.request(app)
                .get('/')
                .end((err, res) => {
                    res.text.should.include('<form action="/login" method="POST">')
                    res.text.should.include('<input name="id"')
                    res.text.should.include('<button>')
                    done();
                });
        });
    });
    describe("GET / authenticated", () => {
        it("should redirect to users page", (done) => {
            chai.request(app)
                .get('/')
                .set('Cookie', `token=${utils.getJWT()}`)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.status(302);
                    res.headers.location.should.equal("/users");
                    done();
                })
        })
    })
});
