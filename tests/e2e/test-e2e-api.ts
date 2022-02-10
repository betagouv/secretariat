import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { EmailStatusCode } from '../../src/models/dbUser';
import app, { fakeMemberRepository, fakeUserRepository } from '../env-test-server'
import { createSeedRegisterMemberDto } from '../fakeRepository/FakeMemberRepository';
import { createDBUser } from '../fakeRepository/FakeUserRepository';

chai.use(chaiHttp);

describe('API', () => {
  describe('GET /api', () => {
    it('should get api info', async () => {
        const dto = createSeedRegisterMemberDto({
            id: 'user.actif'
        });
        await fakeMemberRepository.addMember(dto);
        const user = createDBUser({
            username: 'user.actif',
            primary_email_status: EmailStatusCode.EMAIL_CREATION_PENDING
        })
        await fakeUserRepository.addUser(user)
        const res = await chai.request(app)
            .get('/api')
            .redirects(0)
        expect(res.status).equal(200);
        expect(res.body[0].id).equal(user.username);
    });
})
});
