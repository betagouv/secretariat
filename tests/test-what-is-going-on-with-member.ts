import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '@/index';
import routes from '@/routes/routes';
chai.use(chaiHttp);

describe('Get page what is going on with member', () => {
    describe('GET //que-ce-passe-t-il', () => {
      it('should return a valid page', (done) => {  
        chai.request(app)
          .get(routes.WHAT_IS_GOING_ON_WITH_MEMBER)
          .end((err, res) => {
            res.should.have.status(200);
            done();
          });
      });
    });
})
  