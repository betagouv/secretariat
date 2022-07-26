import axios from "axios"
import config from "../config"

export const postToHook = async (req, res) => {
    if (req.params.hookId === config.CHATWOOT_ID) {
      let conversationId = ''
      try {
        conversationId = req.body.id
      } catch (e) {
        console.error('Could not get conversation Id')
      }
      const message = `:toolbox: Nouvelle demande de support de ${req.body.meta.sender.email} : ${req.body.messages.map(m => m.content).join('/n')}
       /n https://chatwoot.incubateur.net/app/accounts/1/inbox/1/conversations/${conversationId}
      `
      console.log(`Post message : `, message) // Call your action on the request here
      await axios.post(`https://mattermost.incubateur.net/hooks/${config.CHATWOOT_ID}`, {text: message});
    }
}
