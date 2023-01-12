import { getAdmin } from "@/config/admin.config";

// middleware for doing role-based permissions
export enum MemberRole {
    MEMBER_ROLE_ADMIN="MEMBER_ROLE_ADMIN",
    MEMBER_ROLE_USER="MEMBER_ROLE_USER",
    MEMBER_ROLE_SUSPENDED="MEMBER_ROLE_SUSPENDED"
}

export default function permit(...permittedRoles : MemberRole[]) {
    return (request, response, next) => {
        const { auth } = request
        if (auth && permittedRoles.includes(MemberRole.MEMBER_ROLE_ADMIN) && 
            getAdmin().includes(auth.id)) {
            next()
        } else {
            response.status(403).json({message: "Forbidden"}); // user is forbidden
        }
    }
  }