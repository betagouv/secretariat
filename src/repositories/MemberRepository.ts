import betagouv from "../betagouv";
import { Member } from "../models/member";

export interface IMemberRepository {
    getMembers(): Promise<Member[]>;
    getMemberById(id: string);
}

class MemberRepository implements IMemberRepository{

    async getMembers(): Promise<Member[]> {
        return betagouv.usersInfos()
    }

    async getMemberById(id: string) : Promise<Member> {
        return betagouv.userInfosById(id)
    }
}

export default MemberRepository;
