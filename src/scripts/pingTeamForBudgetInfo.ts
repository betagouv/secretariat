import axios from "axios";
//import { Startup } from '../models/startup';

import fs from "fs";
import YAML from "yaml";

import { applyChanges } from "../lib/frontmatter";
import { getChannels } from "../lib/mattermost";
import betagouv from "../betagouv";

const teamIdsToTokenMap = {
}


// List all channels
// identify
// post messages everywhere
// accept /budget

//import cc from "../../chans.json"

const getAllChans = async () => {
    const channels = await getChannels()
    console.log(channels.filter(c => c.display_name.startsWith("startup-")))
}

function getMattermostVarEnv(prefix) {
    const keys = Object.keys(process.env).filter(k => k.startsWith(prefix))
    return keys.reduce((a,v) => {
        a[v.slice(prefix.length)] = process.env[v]
        return a
    }, {})
}

function getMattermostServers() {
    return getMattermostVarEnv("MATTERMOST_SERVER_")
}

function getMattermostHookConfig(config?) {
    setData("MATTERMOST_HOOK_URL_", "url", config)
    return setData("MATTERMOST_HOOK_TOKEN_", "token", config)
}

function getMattermostBotTokens() {
    return getMattermostVarEnv("MATTERMOST_BOT_TOKEN_")
}

function setData(prefix, prop, config) {
    const data = getMattermostVarEnv(prefix)
    const keys = Object.keys(data)
    return keys.reduce((a,v) => {
        const comps = v.split('_')
        const serverId = comps.pop()
        const teamId = comps.join('_')
        a[serverId] = a[serverId] || {}
        a[serverId][teamId] = a[serverId][teamId] || {}
        a[serverId][teamId][prop] = data[v]
        return a
    }, config || {})
}

const buildMattermostConfig = () => {
    const config = {
        servers: getMattermostServers(),
        hooks: getMattermostHookConfig({}),
        bots: getMattermostBotTokens(),
    }
    return config
}

const Broadcast = async () => {
    const config = buildMattermostConfig()
    const server = "cel"
    const team = "societaires"
    const channels = [{
        id : "startup-test"
    }]
    const url = `${config.servers[server]}${config.hooks[server][team].url}`
    const data = {
        channel: channels[0].id,
        text: `:wave: À beta.gouv.fr on aime la transparence. Les fiches publiques sur le site contiennent désormais \
un lien vers une page qui détaillent le budget de l'équipe.
Nous recommandons de faire une page sur [pad.incubateur.net](https://pad.incubateur.net), de la publier et de l'indiquer dans votre fiche produit. Vous pouvez mettre à jour votre fiche directement sur GitHub ou bien en utilisant la commande \`/budget url [startupId] [url]\` !
Dans un premier temps, vous pouvez aussi utiliser la même commande en indiquant le budget total de votre Startup \`/budget page [startupId] [montant]\` par exemple  \`/budget page aides.jeunes 1500000\`.

Si vous avez des questions ou des problèmes, n'hésitez pas à rejoindre le canal [~domaine-transparence-budget](https://mattermost.incubateur.net/betagouv/channels/domaine-transparence-budget).


:wave: @guillett vient de demander la génération d'une première page budget. :tada:
https://beta-gouv-fr-budget.netlify.app/?startup=Aides%20Jeunes&budget=100000&start=2021-03-01&date=2022-07-07&startupId=aides.jeunes
Si vous avez des questions ou des problèmes, n'hésitez pas à rejoindre le canal [~domaine-transparence-budget](https://mattermost.incubateur.net/betagouv/channels/domaine-transparence-budget) :smiley:
`
    }
    const response = await axios.post(url, data)
    const json = response.data
    console.log(json)
}

const magicEnv = () => {
    const keys = Object.keys(process.env).filter(k => k.startsWith("MATTERMOST_TOKEN"))
    const teamIdsToTokenMap = keys.reduce((a, v) => {
        const [teamId, token] = v.split(':')
        a[teamId] = token
        return a
    }, {})
    console.log("Cool")
}

const pingTeamForBudgetInfo0 = async() => {

/*    const startups= await betagouv.startupsInfos()
    const aj = startups.find(s => s.id == "aides.jeunes")
    console.log(aj)
    console.log(JSON.stringify(aj, null, 2))
    console.log(aj.attributes.phases.map(p => p.start))*/

/*

    const url = process.env.MATTERMOST_HOOK_TOKEN_betagouv_beta
    const data = {
        channel: "startup-aides-jeunes",
        text: "Hello!"
    }

    axios.post(url, data)
    budget set-channel aides.jeunes
    */
}

const checkDates = () => {
    const dir = '/home/thomas/repos/beta.gouv.fr/content/_startups/'
    const set = fs.readdirSync(dir)
    const d = set.map(s => {
/*        if (!s.startsWith('aides.')) {
            return
        }*/
        const fullPath = dir + s
        const text = fs.readFileSync(fullPath, 'utf8')
        const [frontmatter, ...body] = text.split("\n---")
        const obj = YAML.parse(frontmatter)

        const dts = obj?.phases.map(p => p.start) || []
        dts.sort()
        return {
            s,
            start: dts.length ? dts[0]: null
        }
    })
}

const AllowYAMLPristineRegeneration = async() => {
    const dir = '/home/thomas/repos/beta.gouv.fr/content/_startups/'
    const set = fs.readdirSync(dir)
    set.forEach(s => {
        const fullPath = dir + s
        const text = fs.readFileSync(fullPath, 'utf8')
        const [frontmatter, ...body] = text.split("\n---")

        const [front] = new YAML.Parser().parse(frontmatter + "\n")
        const doc = front as YAML.CST.Document
        const content = YAML.CST.stringify(doc) + "---" + body.join("\n---")
        if (content != text) {
            console.log(s)
            fs.writeFileSync('test.md', content, "utf8")
            console.log("diff --color " + fullPath + " test.md")
            process.exit(1)
        }
    })
}

const ExperimentApplyingChanges = () => {
    const dir = '/home/thomas/repos/beta.gouv.fr/content/_startups/'
    const set = fs.readdirSync(dir)
    const startupId = "aides.jeunes"
    set.forEach(s => {
        if (s != startupId + ".md") {
            return
        }

        const fullPath = dir + s
        const text = fs.readFileSync(fullPath, 'utf8')
        const changes = {
            channel_url: "https://mattermost.incubateur.net/betagouv/channels/startup-" + startupId + "NEW"
        }
        const {updates, content} = applyChanges(text, changes)
        console.log(updates)
        fs.writeFileSync(fullPath, content, "utf8")
    })
}

//AllowYAMLPristineRegeneration()
//ExperimentApplyingChanges()

//pingTeamForBudgetInfo0()
//checkDates()
//magicEnv()
//getAllChans()
//buildMattermostConfig()
 Broadcast()
