import axios from "axios"

interface SendInfoToChatProps {
    text: string,
    channel?: string,
    username?: string,
    space?: 'communaute' | 'dinum',
    extra?: {
      username?: string,	// Overrides the username the message posts as. Defaults to the username set during webhook creation or the webhook creator’s username if the former was not set.
      icon_url?: string, //	Overrides the profile picture the message posts with.
      icon_emoji?: string, // Overrides the profile picture and icon_url parameter.The expected content is an emoji name, as typed in a messageattachments	Message attachments used for richer formatting options.	If text is not set, yes
    },
    hookURL?: string
}

enum WEBHOOK_CHANNEL_TYPE {
    WEBHOOK_SECRETARIAT='WEBHOOK_SECRETARIAT',
    WEBHOOK_GENERAL='WEBHOOK_GENERAL',
    WEBHOOK_DINUM_CENTREVILLE='WEBHOOK_DINUM_CENTREVILLE',
    WEBHOOK_GIP='WEBHOOK_GIP'
}

interface SendIntoToChatFromMattermostDeps {
    config: Record<WEBHOOK_CHANNEL_TYPE, string>
}

export type SendInfoToChat = (props: SendInfoToChatProps) => Promise<null>

export const makeSendIntoToChatFromMattermost = (deps: SendIntoToChatFromMattermostDeps): SendInfoToChat => {
    const { config } = deps
    return async function sendIntoToChatFromMattermost (props: SendInfoToChatProps) {
        const {
            text,
            channel,
            username,
            extra,
            space,
        } = props
        let hookURL = props.hookURL
        let params: {
          text: string,
          channel: string,
          username?: string,
          icon_url?: string,
          icon_emoji?: string,
        } = { text, channel: channel === 'general' ? 'town-square' : channel };
        if (!hookURL) {
          if (space === 'dinum') {
            hookURL = config[WEBHOOK_CHANNEL_TYPE.WEBHOOK_DINUM_CENTREVILLE]
          } else if (channel && channel !== 'secretariat') {
            hookURL = config[WEBHOOK_CHANNEL_TYPE.WEBHOOK_GENERAL]
          } else {
            hookURL= config[WEBHOOK_CHANNEL_TYPE.WEBHOOK_SECRETARIAT]
          }
        }
        if (username) {
          params.channel = `@${username}`;
        }
        if (extra) {
          params = {
            ...params,
            ...extra
          }
        }
        try {
          return await axios.post(hookURL, params);
        } catch (err) {
          throw new Error(`Error to notify slack: ${err}`);
        }
    }
}

