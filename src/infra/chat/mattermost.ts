import axios from "axios"

interface SendInfoToChatProps {
    text: string,
    channel?: string,
    username?: string
}

enum WEEBHOOK_CHANNEL_TYPE {
    WEBHOOK_SECRETARIAT='WEBHOOK_SECRETARIAT',
    WEBHOOK_GENERAL='WEBHOOK_GENERAL'
}

interface SendIntoToChatFromMattermostDeps {
    config: Record<WEEBHOOK_CHANNEL_TYPE, string>
}

export type SendInfoToChat = (email: SendInfoToChatProps) => Promise<null>

export const makeSendIntoToChatFromMattermost = (deps: SendIntoToChatFromMattermostDeps): SendInfoToChat => {
    const { config } = deps
    return async function sendIntoToChatFromMattermost (props: SendInfoToChatProps) {
        const {
            text,
            channel,
            username,
        } = props

        let hookURL = config[WEEBHOOK_CHANNEL_TYPE.WEBHOOK_SECRETARIAT]
        const params: any = { text, channel: channel === 'general' ? 'town-square' : channel };
        if (channel && channel !== 'secretariat') {
          hookURL = config[WEEBHOOK_CHANNEL_TYPE.WEBHOOK_GENERAL]
        }
        if (username) {
          params.channel = `@${username}`;
        }
        try {
          return await axios.post(hookURL, params);
        } catch (err) {
          throw new Error(`Error to notify slack: ${err}`);
        }
    }
}

