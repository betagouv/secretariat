import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import app from '@/index';
import utils from './utils';
import * as session from '@/helpers/session'

chai.use(chaiHttp);
chai.should();

describe('Home', () => {
  describe('GET / unauthenticated', () => {
    it('should return valid page', (done) => {
      chai.request(app)
        .get('/')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          done();
        });
    });

    it('should show the login form', (done) => {
      chai.request(app)
        .get('/')
        .end((err, res) => {
          res.text.should.include('<form action="/login?next=/" method="POST"');
          res.text.should.include('<input name="emailInput"');
          res.text.should.include('<button class="button" id="primary_email_button">');
          done();
        });
    });
  });
  describe('GET / authenticated', () => {
    let getToken
    
    beforeEach(() => {
      getToken = sinon.stub(session, 'getToken')
      getToken.returns(utils.getJWT('membre.actif'))
    })

    afterEach(() => {
      getToken.restore()
    })

    it('should redirect to community page', (done) => {
      chai.request(app)
        .get('/')
        .redirects(0)
        .end((err, res) => {
          res.should.have.status(302);
          res.header.location.should.equal('/account');
          done();
        });
    });
  });
});
