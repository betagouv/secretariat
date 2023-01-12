import sinon from 'sinon';
import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '@/index';
import routes from '@/routes/routes';
import * as github from '@lib/github'
chai.use(chaiHttp);

describe('GET pull request watchers', () => {

    describe('GET /users/:username/email unauthenticated', () => {
        it('should return an Unauthorized error', async () => {
            let pullRequestStub = sinon.stub(github,'getPullRequests')
            pullRequestStub.returns(Promise.resolve([]))
            const res = await chai
            .request(app)
            .get(routes.PULL_REQUEST_GET_PRS)
            pullRequestStub.called.should.be.true
            pullRequestStub.restore()

        });
    })
})
