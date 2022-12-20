import axios from "axios"
import config from "@config"

type 

interface ISibWebhookBody {
  event: 'soft_bounce' | 'hard_bounce' | 'blocked' | 'invalid_email' | 'error' | 'unsubscribed',
  email: string,
  id: number,
  timestamp: number,
  ts_event: number
  date: string,
  'message-id': string,
}

export const postToHook = async (req, res) => {
    if (req.params.hookId === config.SIB_WEBHOOK_ID) {
      let sibWebhookBody = req.body as ISibWebhookBody

      const message = `:toolbox: Webhook send in blue\n
email: ${sibWebhookBody.email}\n
statut de l'email : ${sibWebhookBody.event}\n
`
      await axios.post(`https://mattermost.incubateur.net/hooks/${config.SIB_WEBHOOK_ID}`, {text: message});
    } else if (req.params.hookId === config.CHATWOOT_ID) {
      let conversationId = ''
      try {
        conversationId = req.body.id
      } catch (e) {
        console.error('Could not get conversation Id')
      }
      if (config.CHATWOOT_IGNORE_EMAILS && config.CHATWOOT_IGNORE_EMAILS.includes(req.body.meta.sender.email)) {
        console.log(`Ignore message from ${req.body.meta.sender.email}`)
        return
      }
      const message = `:toolbox: Nouvelle demande de support de ${req.body.meta.sender.email} : ${req.body.messages.map(m => m.content).join('/n')}
https://chatwoot.incubateur.net/app/accounts/1/inbox/1/conversations/${conversationId}
      `
      console.log(`Post message : `, message) // Call your action on the request here
      await axios.post(`https://mattermost.incubateur.net/hooks/${config.CHATWOOT_ID}`, {text: message});
    }
}
