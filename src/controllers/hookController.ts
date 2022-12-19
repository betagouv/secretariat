import axios from "axios"
import config from "@config"

export const postToHook = async (req, res) => {
    console.log(req.params)
    console.log(req.body)
    if (req.params.hookId === config.CHATWOOT_ID) {
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
