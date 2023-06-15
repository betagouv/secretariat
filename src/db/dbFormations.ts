import db from ".";
import { Formation } from '@models/formation'

interface CreateFormationProps extends Omit<Formation, 'id' | 'created_at' | 'updated_at' >{}
interface UpdateFormationProps extends Partial<Omit<Formation, 'id' | 'created_at' | 'update_at'>>{}

export const createFormation = (props: CreateFormationProps) : Promise<Formation> => {
    return db('formations').insert({
        ...props
    }).returning('*').then(res => res[0])
}

export const updateFormation = async(props: UpdateFormationProps, id: string) : Promise<void> => {
    console.log(props, id)
    await db('formations').update({
        ...props
    }).where({
        id
    })
    return
}

export const getFormation = (username: string) : Promise<Formation | undefined> => {
    return db('formations').where({ username}).first()
}

