import makeApiController from '../src/controllers/APIController';
import makeUserService from '../src/services/UserService';
import FakeMemberRepository from './fakeRepository/FakeMemberRepository';
import FakeUserRepository from './fakeRepository/FakeUserRepository';
import createApp from '../src/server';

export const fakeUserRepository = new FakeUserRepository();
export const fakeMemberRepository = new FakeMemberRepository();

const apiController = makeApiController(
    makeUserService(
        fakeUserRepository,
        fakeMemberRepository)
)
const app = createApp({
    apiController
})

export default app