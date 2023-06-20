import db from ".";
import { UserFormation } from '@models/user_formation'

interface CreateUserFormationProps extends Omit<UserFormation, 'id' | 'created_at' | 'updated_at' >{}
interface UpdateUserFormationProps extends Partial<Omit<UserFormation, 'id' | 'created_at' | 'update_at'>>{}

export const createUserFormation = (props: CreateUserFormationProps) : Promise<UserFormation> => {
    return db('users_formations').insert({
        ...props
    }).returning('*').then(res => res[0])
}

export const updateUserFormation = async(props: UpdateUserFormationProps, id: string) : Promise<void> => {
    console.log(props, id)
    await db('users_formations').update({
        ...props
    }).where({
        id
    })
    return
}

export const getUsersFormations = (username: string) : Promise<UserFormation | undefined> => {
    return db('users_formations').where({ username}).first()
}

