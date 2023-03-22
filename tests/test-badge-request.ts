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
            .send({})

        res.should.have.status(401);
    })

    it('should be able to post badge request', async () => {
        const res = await chai.request(app)
            .post(routes.API_POST_BADGE_REQUEST)
            .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
            .set('content-type', 'application/json')
            .send()
        res.should.have.status(200);
        const res2 = await chai.request(app)
        .post(routes.API_POST_BADGE_REQUEST)
        .set('Cookie', `token=${utils.getJWT('membre.actif')}`)
        .set('content-type', 'application/json')
        .send()
        res2.should.have.status(200);
        res2.body.dossier_number.should.equals(res.body.dossier_number)
    })
});

describe('POST /api/badge/status', () => {

    it('should be able to update badge request', async () => {
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


