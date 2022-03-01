import { IUserRepository } from "../../src/repositories/UserRepository";
import { DBUser, EmailStatusCode } from "../../src/models/dbUser";

class FakeUserRepository implements IUserRepository {

    users: DBUser[] = [] 

    async getUsersWithParams(params={}): Promise<DBUser[]> {
        return this.users.filter(user => {
            const values = Object.keys(params).map(key => {
                return user[key] === params['key']
            })
            return values.every(value => value === true)
        })
    }

    async updateUser(username: string, data: object = {}) : Promise<DBUser> {
        const userIndex = this.users.findIndex(user => user.username === username)
        let user = this.users[userIndex]
        if (!user) {
            throw new Error('No user found')
        }
        user = {
            ...user,
            ...data
        }
        this.users[userIndex] = user
        return Promise.resolve(user)
    }

    async addUser(DBUser: DBUser) : Promise<DBUser> {
        this.users.push(DBUser)
        return DBUser
    }
}

export function createDBUser(opts: Partial<DBUser>={}): DBUser {
    return {
        secondary_email: '',
        primary_email: '',
        username: '',
        created_at: new Date(),
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        primary_email_status_updated_at: new Date(),
        ...opts
    };
}

export default FakeUserRepository;
