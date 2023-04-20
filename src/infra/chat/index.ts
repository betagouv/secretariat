import config from "@/config";
import { makeSendIntoToChatFromMattermost } from "./mattermost";
import * as mattermost from '@/lib/mattermost';

export const sendInfoToChat = makeSendIntoToChatFromMattermost({
    config: {
        WEBHOOK_GENERAL: config.CHAT_WEBHOOK_URL_GENERAL,
        WEBHOOK_SECRETARIAT: config.CHAT_WEBHOOK_URL_SECRETARIAT,
        WEBHOOK_DINUM_CENTREVILLE: config.CHAT_WEBHOOK_URL_DINUM
    }
})

export const getAllChannels = process.env.NODE_ENV === 'development' ? async () => {
    return Promise.resolve([
        { name: 'Test1', 'display_name': 'test1'},
        { name: 'town-square', 'display_name': 'test2'}
    ])
} : mattermost.getAllChannels

export const getUserWithParams = process.env.NODE_ENV === 'development' ? async () => {
    return Promise.resolve([
        {
            email: 'firstname.lastname@incubateur.net',
            username: 'firstname.lastname',   
        },
        {
            email: 'firstname.lastname.toto@incubateur.net',
            username: 'firstname.lastname.toto',   
        },
        {
            email: `julien.dauphant@${config.domain}`,
            username: 'julien.dauphant',   
        }
    ])
} : mattermost.getUserWithParams
