import { Member, PartialMember } from "../../src/models/member";
import { IMemberRepository } from "../../src/repositories/MemberRepository";

class FakeMemberRepository implements IMemberRepository{

    members = []
    
    constructor(members : Member[] = []) {
        this.members = members
    }

    async getMembers(): Promise<Member[]> {
        return this.members
    }

    async getMemberById(id: string) : Promise<Member> {
        return this.members.find(user => user.id === id)
    }

    async addMember(member: Member): Promise<Member[]> {
        this.members.push(member)
        return this.members
    } 
}

export function createSeedRegisterMemberDto (opts: PartialMember={}): Member {
    return {
        id: '124558',
        fullname: '',
        github: '',
        email: '',
        missions: [],
        startups: [],
        previously: [],
        start: '',
        end: '',
        employer: '',
        domaine: 'Animation',
        ...opts
    };
}

export default FakeMemberRepository;
