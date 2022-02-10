import { EmailStatusCode } from "../../src/models/dbUser";
import { MemberWithPrimaryEmailStatus } from "../../src/models/member";
import { IMemberRepository } from "../../src/repositories/MemberRepository";
import { IUserRepository } from "../../src/repositories/UserRepository";
import makeUserService, { IUserService } from "../../src/services/UserService";
import FakeMemberRepository, { createMember } from "../fakeRepository/FakeMemberRepository";
import FakeUserRepository, { createDBUser } from "../fakeRepository/FakeUserRepository";
import { expect } from 'chai'

interface FakeRepository {
    addMember(member: any): Promise<any>
}
let fakeUserRepository: IUserRepository
let fakeMemberRepository: IMemberRepository & FakeRepository
let userService: IUserService

describe('Api public user infos', () => {
    // avant chaque test.
    beforeEach (() => {
        fakeUserRepository = new FakeUserRepository();
        fakeMemberRepository = new FakeMemberRepository();
        userService = makeUserService(fakeUserRepository, fakeMemberRepository);
    });

    it('should response with array of members', async () => {
        const dto = createMember({
            id: 'user.actif'
        });
        await fakeMemberRepository.addMember(dto);
        const user = createDBUser({
            username: 'user.actif',
            primary_email_status: EmailStatusCode.EMAIL_CREATION_PENDING
        })
        await fakeUserRepository.addUser(user)
        // Affirmer
        const userPublicInfos : MemberWithPrimaryEmailStatus[] = await userService.getUsersPublicInfos()
        expect(userPublicInfos[0].id).equal(dto.id)
        expect(userPublicInfos[0].primary_email_status).equal(user.primary_email_status)
    });
});


 
