import type { Request } from 'express'
import { Member } from '@models/member';

export interface Option {
    value: string,
    label: string
}

export interface CommunityProps {
    title: string,
    currentUserId: string,
    errors: string[],
    messages: string[],
    users: Member[],
    activeTab: string,
    request: Request,
    incubatorOptions: Option[],
    startupOptions: Option[],
    domaineOptions: Option[],
    isAdmin: boolean
}

export * from './Community';

