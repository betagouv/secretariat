import axios from "axios";

import config from "../config";
import betagouv from "../betagouv";
import * as utils from "./utils";

import { applyChanges } from "../lib/frontmatter"

const mattermost = config.mattermost
const serverKeys = Object.keys(mattermost.servers)

export function determineMattermostServer(req, res, next) {
  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify({...req.body, trigger_id: null, token: null}))
  } else {
    console.log(JSON.stringify(req.body, null, 2))
  }
  if (!req.body?.response_url?.length && !req.body?.context?.response_url?.length) {
    return res.json({
      text: "Il n’y a ni _response_url_ ni _context._response_url_ dans la requête. Impossible d’en déterminer l’origine. Abandon…"
    })
  }

  const mattermostUrl = new URL(req.body?.response_url || req.body?.context?.response_url)
  req.mattermostServerId = serverKeys.find(k => {
    return mattermost.servers[k].startsWith(mattermostUrl.origin)
  })
  if (!req.mattermostServerId) {
    return res.json({
      text: `${mattermostUrl.origin} n’est pas un serveur Mattermost connu. Abandon…`
    })
  }
  next()
}

export function checkToken(req, res, next) {
  req.payload = {...req.body?.context, ...req.body}

  if (!req.payload.token) {
    return res.json({
      text: "Aucun token pour valider la requête. Abandon…"
    })
  }
  if (!mattermost.hooks[req.mattermostServerId][req.payload.team_domain]?.token) {
    return res.json({
      text: `Aucun token associé à '${req.payload.team_domain}' team_domain de la requête. Abandon…`
    })
  }
  if (req.payload.token != mattermost.hooks[req.mattermostServerId][req.payload.team_domain].token) {
    return res.json({
      text: "Le token contenu dans la requête ne correspond pas à celui connu. Abandon…"
    })
  }
  next()
}

function buildBudgetURL(startup, budget) {
  const startDts = startup.attributes?.phases?.map(p => p?.start).filter(p => p) || []
  startDts.sort()

  const url = new URL('https://beta-gouv-fr-budget.netlify.app')
  url.searchParams.append('budget', budget)
  const date = new Date()
  url.searchParams.append('date', date.toISOString().slice(0,10))
  if (startDts.length) {
    url.searchParams.append('start', startDts[0])
  }
  url.searchParams.append('startup', startup.attributes.name)
  url.searchParams.append('startupId', startup.id)
  return url.toString()
}

export function manageInteractiveActionCall(req, res, next) {
  if (!req.payload.command) {
    if (req.payload.action === "publish") {
      axios.post(req.payload.response_url, {
        text: `@${req.payload.user_name} vient de demander la publication d’une page budget :smiley: :tada:
    C’est celle-là : ${req.payload.budget_url}
    On fait quelques vérifications, on appelle GitHub et on revient vers vous !`,
        response_type: 'in_channel',
      })

      req.budget_url = req.payload.budget_url
      req.startupId = req.payload.startup
      return next()
    } else if (req.payload.action === "custom") {
      return axios.post(req.payload.response_url, {
        text: `@${req.payload.user_name} pour publier une page de budget personnalisée, vous pouvez utiliser la commande \`/budget url ${req.payload.startup} [url]\` !`,
        response_type: 'in_channel',
      })
    } else {
      return axios.post(req.payload.response_url, {
        text: `BUG!`,
        response_type: 'in_channel',
      })
    }
  }
  next()
}

export async function manageSlashCommand(req, res, next) {
  if (req.startupId) {
    return next()
  }
  if (!req.payload.channel_name) {
    return res.json({
      "text": "La requête ne contient pas d’informations sur la chaîne Mattermost. Abandon…"
    })
  }

  const [subcommand, startupId, details] = req.payload.text.split(" ")?.filter(e => e.length) || []
  if (["page", "url"].indexOf(subcommand) < 0) {
    return res.json({
      "text": `On ne sait pas quoi faire avec la commande \`${req.payload.command} ${req.payload.text}\`. Abandon…`
    })
  }

  const startups = await betagouv.startupsInfos()
  const startup = startups.find(s => s.id == startupId)
  if (!startup) {
    return axios.post(req.body.response_url, {
      text: `Aucune startup ne correspond à l’identifiant '${startupId}'`,
      response_type: 'in_channel',
    })
  }
  req.startup = startup
  req.startupId = startup.id
  if (subcommand === "page") {
    res.json({
      text: `@${req.payload.user_name} vient de demander la génération d’une page budget :smiley: avec la commande \`${req.payload.command} ${req.payload.text}\` :tada:
  On fait quelques vérifications et on revient vers vous !`,
      response_type: 'in_channel',
    })

    req.budget_url = buildBudgetURL(startup, details)

    const response_payload = {
      text: `@${req.payload.user_name}, voilà la page budget demandée :smiley: avec la commande \`${req.payload.command} ${req.payload.text}\` :tada:
${req.budget_url}
Si vous avez des questions ou des problèmes, n’hésitez pas à rejoindre le canal [~domaine-transparence-budget](https://mattermost.incubateur.net/betagouv/channels/domaine-transparence-budget) :smiley:
`,
      response_type: 'in_channel',
      attachments: [{
        actions: [{
          id: "publish",
          name: "Publier cette première version",
          integration: {
            url: `${config.protocol}://${config.host}/notifications/budget`,
            context: {
              action: "publish",
              budget_url: req.budget_url,
              response_url: req.body.response_url,
              startup: startupId,
              token: req.body.token,
            }
          }
        }, {
          id: "custom",
          name: "Publier une autre page",
          integration: {
            url: `${config.protocol}://${config.host}/notifications/budget`,
            context: {
              action: "custom",
              response_url: req.body.response_url,
              startup: startupId,
              token: req.body.token,
            }
          }
        }]
      }]
    }
    console.log(JSON.stringify(response_payload))
    return axios.post(req.body.response_url, response_payload)

  } else if (subcommand === "url") {
    res.json({
      text: `@${req.payload.user_name} vient de demander la publication d’une page budget :smiley: avec la commande \`${req.payload.command} ${subcommand} ${startupId} [url]\` :tada:
  C’est celle-là : ${details}
  On fait quelques vérifications, on appelle GitHub et on revient vers vous !`,
      response_type: 'in_channel',
    })

    req.budget_url = details
    req.channel_url = `${mattermost.servers[req.mattermostServerId]}/${req.payload.team_domain}/channels/${req.payload.channel_name}`
    next()
  }
}

async function addStartupProps(startupId, props, res) {
  const propNames = Object.keys(props)
  propNames.sort()
  const branch = utils.createBranchName('startup-', startupId, `-${propNames.join(',')}`);
  const path = `content/_startups/${startupId}.md`;
  return utils.getGithubMasterSha()
  .then((response) => {
    const { sha } = response.data.object;
    return utils.createGithubBranch(sha, branch);
  })
  .then(() => utils.getGithubFile(path, branch))
  .then((res) => {
    const text = Buffer.from(res.data.content, 'base64').toString('utf-8')
    const {content, updates} = applyChanges(text, props)

    return utils.createGithubFile(path, branch, content, res.data.sha).then(() => updates)
  })
  .then((updates) => {
    return utils.makeGithubPullRequest(branch, `Mise à jour de la fiche de ${startupId}`)
    .then((pullRequest) => {
      return { updates, pullRequest }
    })
  })
  .catch(err => {
    console.error(err)
    throw err
  })
}

export async function createPullRequest(req, res, next) {
  const data = {
    budget_url: req.budget_url,
    //channel_url: req.channel_url,
  }
  const result = await addStartupProps(req.startupId, data, res)
  return axios.post(req.payload.response_url, {
    text: `@${req.payload.user_name}, la page budget a été ajoutée à la fiche GitHub :tada:
Maintenant il faut valider la _pull request_ : ${result.pullRequest.data.html_url}
Si vous avez des questions ou des problèmes, n’hésitez pas à rejoindre le canal [~domaine-transparence-budget](https://mattermost.incubateur.net/betagouv/channels/domaine-transparence-budget) :smiley:
`,
    response_type: 'in_channel',
    })
}
