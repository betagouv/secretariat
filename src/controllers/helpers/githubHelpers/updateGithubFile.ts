import { createGithubBranch, createGithubFile, getGithubFile, getGithubMasterSha, makeGithubPullRequest, PRInfo } from "@/lib/github";
import { GithubMission } from "@/models/mission";
import { Phase } from "@/models/startup";
import { createBranchName } from "./createBranchName";

export interface GithubAuthorChange {
    role?: string,
    missions?: GithubMission[],
    startups?: string[],
    previously?: string[],
}

export interface GithubStartupChange {
    phases?: Phase[],
    link: string,
    dashlord_url: string,
    mission: string,
    stats_url: string,
    repository: string
}

async function updateGithubFile(name: string, path: string, changes: GithubAuthorChange | GithubStartupChange, mainContent?: string) : Promise<PRInfo> {
    const branch = createBranchName(name);
    console.log(`Début de la mise à jour de la fiche pour ${name}...`);

    return await getGithubMasterSha()
        .then((response) => {
            const { sha } = response.data.object;
            console.log('SHA du master obtenu');
            return createGithubBranch(sha, branch);
        })
        .then(() => {
            console.log(`Branche ${branch} créée`);
            return getGithubFile(path, branch);
        })
        .then((res) => {
            const yaml = require('js-yaml');
            let content = Buffer.from(res.data.content, 'base64').toString('utf-8');
            let splitDoc = content.split('---')
            const doc = yaml.load(splitDoc[1])
            for (const key of Object.keys(changes)) {
                const value = changes[key]
                if (!value || (Array.isArray(value) && !value.length)) {
                    delete doc[key]
                } else {
                    doc[key] = changes[key]
                }
            }
            const schema = yaml.DEFAULT_SCHEMA
            schema.compiledTypeMap.scalar['tag:yaml.org,2002:timestamp'].represent = function(object) {
                return object.toISOString().split('T')[0];
            }
            content = '---\n' + yaml.dump(doc, {
                schema: schema
            }) + '---'
            if (mainContent) {
                content = content + '\n' + mainContent
            } else if (splitDoc[2]) {
                content = content + splitDoc[2]
            }
            return createGithubFile(path, branch, content, res.data.sha);
        })
        .then(() => {
            console.log(`Fiche Github pour ${name} mise à jour dans la branche ${branch}`);
            return makeGithubPullRequest(branch, `Mise à jour de ${name}`);
        })
        .then((response) => {
            console.log(`Pull request pour la mise à jour de la fiche de ${name} ouverte`);
            if (response.status !== 201 && response.data.html_url) {
                throw new Error('Il y a eu une erreur merci de recommencer plus tard')
            }
            return response.data
        })
        .catch((err) => {
            console.log(err);
            throw new Error(`Erreur Github lors de la mise à jour de la fiche de ${name}`);
        });
}

export async function updateAuthorGithubFile(username: string, changes: GithubAuthorChange) : Promise<PRInfo> {
    const path = `content/_authors/${username}.md`;
    return updateGithubFile(username, path, changes)
}

export async function updateStartupGithubFile(startupname: string, changes: GithubStartupChange, content: string) : Promise<PRInfo> {
    const path = `content/_startups/${startupname}.md`;
    return updateGithubFile(startupname, path, changes, content)
}
