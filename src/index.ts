import makeApiController from './controllers/APIController'
import createApp from './server'
import UserRepository from './repositories/UserRepository';
import MemberRepository from './repositories/MemberRepository';
import makeUserService from './services/UserService';

const userRepository = new UserRepository()
const memberRepository = new MemberRepository()

const apiController = makeApiController(
  makeUserService(
    userRepository,
    memberRepository
))

export default createApp({
  apiController: apiController
})
