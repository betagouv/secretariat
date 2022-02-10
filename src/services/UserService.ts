import { DBUser } from "../models/dbUser";
import { Member, MemberWithPrimaryEmailStatus } from "../models/member";
import { IMemberRepository } from "../repositories/MemberRepository";
import { IUserRepository } from "../repositories/UserRepository";

export interface IUserService {
    getUsersPublicInfos(): Promise<MemberWithPrimaryEmailStatus[]>
}

function makeUserService(userRepository: IUserRepository, memberRepository: IMemberRepository) {
    return {
        async getUsersPublicInfos(): Promise<MemberWithPrimaryEmailStatus[]> {
            const dbUsers: DBUser[] = await userRepository.getUsersWithParams();
            const members: Member[] = await memberRepository.getMembers();
            const membersWithPrimaryEmailStatus : MemberWithPrimaryEmailStatus[] = members.map((user: Member) => {
                const dbUser = dbUsers.find(dbUser => dbUser.username === user.id)
                return {
                    ...user,
                    primary_email_status: dbUser ? dbUser.primary_email_status : undefined
                }
            })
            return membersWithPrimaryEmailStatus;
        }
    } as IUserService
} 

export default makeUserService;