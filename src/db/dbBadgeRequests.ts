import db from ".";
import { BadgeRequest } from '@models/badgeRequests'

interface CreateBadgeRequestProps extends Omit<BadgeRequest, 'id' | 'created_at' | 'updated_at' >{}
interface UpdateBadgeRequestProps extends Partial<Omit<BadgeRequest, 'id' | 'created_at' | 'update_at'>>{}

export const createBadgeRequest = (props: CreateBadgeRequestProps) : Promise<BadgeRequest> => {
    return db('badge_requests').insert({
        ...props
    }).returning('*').then(res => res[0])
}

export const updateBadgeRequest = async(props: UpdateBadgeRequestProps, username: string) : Promise<void> => {
    console.log(props, username)
    await db('badge_requests').update({
        ...props
    }).where({
        username
    })
    return
}

export const getBadgeRequest = (username: string) : Promise<BadgeRequest | undefined> => {
    return db('badge_requests').where({ username}).first()
}

