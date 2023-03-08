import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '@/index';
import routes from '@/routes/routes';
import utils from './utils';

chai.use(chaiHttp);

describe('POST /api/badge', () => {

    it('should not be able to post badge request if not connected', async () => {
        const res = await chai.request(app)
            .post(routes.API_POST_BADGE_REQUEST)
            .send({
                endDate: new Date()
            })

        res.should.have.status(401);
    })

    it('should be able to post badge request', async () => {
        const res = await chai.request(app)
            .post(routes.API_POST_BADGE_REQUEST)
            .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
            .set('content-type', 'application/json')
            .send({
                endDate: new Date()
            })

        res.should.have.status(200);
    })

    it('should be able to post badge request and get same request_id', async () => {
        const res = await chai.request(app)
            .post(routes.API_POST_BADGE_REQUEST)
            .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
            .set('content-type', 'application/json')
            .send({
                endDate: new Date()
            })
            
        res.should.have.status(200);
    })
});

describe('POST /api/badge/status', () => {

    it('should be able to post badge request', async () => {
        const res = await chai.request(app)
            .put(routes.API_UPDATE_BADGE_REQUEST_STATUS)
            .set('content-type', 'application/json')
            .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        res.should.have.status(200);
    })
});

describe('GET /account/badge page', () => {

    it('should not be able to get badge request page', (done) => {
        chai.request(app)
            .get(routes.ACCOUNT_GET_BADGE_REQUEST_PAGE)
            .redirects(0)
            .end((err, res) => {
            res.should.have.status(302);
            done()
        });
    })

    it('should be able to get badge request page', (done) => {
        chai.request(app)
            .get(routes.ACCOUNT_GET_BADGE_REQUEST_PAGE)
            .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
            .redirects(0)
            .end((err, res) => {
            res.should.have.status(200);
            done()
        });
    })
});


