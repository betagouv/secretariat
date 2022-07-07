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

export const buildMattermostConfig = () => {
    const config = {
        servers: getMattermostServers(),
        hooks: getMattermostHookConfig({}),
        bots: getMattermostBotTokens(),
    }
    return config
}