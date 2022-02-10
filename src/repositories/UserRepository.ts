import knex from "../db";
import { DBUser } from "../models/dbUser"

export interface IUserRepository {
    getUsersWithParams(): Promise<DBUser[]>;
    updateUser(username: string, params: object);
    addUser(dbUser: DBUser): Promise<DBUser>;
}

class UserRepository implements IUserRepository{

    async getUsersWithParams(params={}): Promise<DBUser[]> {
        return knex('users').where({
            ...params
        });
    }

    async updateUser(username: string, data) : Promise<DBUser> {
        return knex('users').where({
            username
        }).update({
            ...data
        })
    }

    addUser(dbUser: DBUser): Promise<DBUser> {
        return knex('users').insert({
            ...dbUser
        })
    }
}

export default UserRepository;
