import config from "../config";
import betagouv from "../betagouv";
import * as utils from "./utils";

import { applyChanges } from "../lib/frontmatter"

const mattermost = config.mattermost
const serverKeys = Object.keys(mattermost.servers)

export function determineMattermostServer(req, res, next) {
  console.log(JSON.stringify(req.body, null, 2))
  if (!req.body?.response_url?.length) {
    return res.json({
      text: "La propriété response_url est absente de la requête. Impossible d’en déterminer l’origine. Abandon…"
    })
  }
  const mattermostUrl = new URL(req.body?.response_url)

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
  if (!req.body?.token) {
    return res.json({
      text: "Aucun token pour valider la requête. Abandon…"
    })
  }
  if (!mattermost.hooks[req.mattermostServerId][req.body?.team_domain]?.token) {
    return res.json({
      text: `Aucun token associé à '${req.body?.team_domain}' team_domain de la requête. Abandon…`
    })
  }
  if (req.body?.token != mattermost.hooks[req.mattermostServerId][req.body.team_domain].token) {
    return res.json({
      text: "Le token contenu dans la requête ne correspond pas à celui connu. Abandon…"
    })
  }
  next()
}

function buildBudgetURL(startup, budget) {
  if (budget.startsWith('http') || parseInt(budget) === NaN) {
    return budget
  } else {
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
}

export async function determineMetadata(req, res, next) {
  if (!req.body?.channel_name) {
    return res.json({
      "text": "La requête ne contient pas d’informations sur la chaîne Mattermost. Abandon…"
    })
  }

  const [subcommand, startupId, details] = req.body?.text.split(" ")?.filter(e => e.length) || []
  const startups = await betagouv.startupsInfos()
  const startup = startups.find(s => s.id == startupId)
  if (!startup) {
    return res.json({
      text: `Aucune startup ne correspond à l’identifiant '${startupId}'`
    })
  }
  req.startup = startup
  console.log(subcommand)
  if (subcommand === "page") {
    req.budget_url = buildBudgetURL(startup, details)
    return res.json({
      text: `${req.body?.user_name} vient de demander la génération d'une page budget :smiley: (avec la commande \`${req.body?.command} ${req.body?.text}\` :tada:).
La voilà :
${req.budget_url}
Si vous avez des questions ou des problèmes, n'hésitez pas à rejoindre le canal [~domaine-transparence-budget](https://mattermost.incubateur.net/betagouv/channels/domaine-transparence-budget) :smiley:
`,
      response_type: 'in_channel',
      attachments: [{
        actions: [{
          "id": `${req.body.trigger_id}-publish`,
          "name": "Publier cette première version",
          "integration": {
            "url": "/notifications/budget/mattermost",
            "context": {
              "token": req.body.token,
              "startup": startupId,
              "budget_url": req.budget_url,
            }
          }
        }]
      }]
    })
  }
  req.budget_url = details
  req.channel_url = `${mattermost.servers[req.mattermostServerId]}/${req.body?.team_domain}/channels/${req.body?.channel_name}`
  next()
}

async function addStartupProps(startup, props, res) {
  const propNames = Object.keys(props)
  propNames.sort()
  const branch = utils.createBranchName('startup-', startup.id, `-${propNames.join(',')}`);
  //const path = `content/_startups/${startup.id}.md`;
  const path = `${startup.id}.md`;
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
    return utils.makeGithubPullRequest(branch, `Mise à jour de la fiche de ${startup.id}`)
    .then((pullRequest) => {
      return { updates, pullRequest }
    })
  })
}

export async function createPullRequest(req, res, next) {
  const data = {
    budget_url: req.budget_url,
    //channel_url: req.channel_url,
  }
  const result = await addStartupProps(req.startup, data, res)
  return res.json({text: "DONE", response_type: "in_channel", ...result})
}
