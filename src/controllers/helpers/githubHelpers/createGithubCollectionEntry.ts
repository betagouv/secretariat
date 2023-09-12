import { createGithubBranch, createGithubFile, getGithubMasterSha, makeGithubPullRequest, PRInfo } from "@/lib/github";
import { createBranchName } from "./createBranchName";
import { GithubAuthorChange, GithubStartupChange } from "./githubEntryInterface";

async function createGithubCollectionEntry(name: string, path: string, changes: GithubAuthorChange | GithubStartupChange, mainContent?: string) : Promise<PRInfo> {
    const branch = createBranchName(name);
    console.log(`Début de la création de fiche pour ${name}...`);
    
    return await getGithubMasterSha()
        .then((response) => {
            const { sha } = response.data.object;
            console.log('SHA du master obtenu');
            return createGithubBranch(sha, branch);
        })
        .then((res) => {
            console.log(`Branche ${branch} créée`);
            const yaml = require('js-yaml');
            const doc = changes
            const schema = yaml.DEFAULT_SCHEMA
            schema.compiledTypeMap.scalar['tag:yaml.org,2002:timestamp'].represent = function(object) {
                return object.toISOString().split('T')[0];
            }
            let content = '---\n' + yaml.dump(doc, {
                schema: schema
            }) + '---'
            if (mainContent) {
                content = content + '\n' + mainContent
            }
            return createGithubFile(path, branch, content, res.data.sha);
        })
        .then(() => {
            console.log(`Fiche Github pour ${name} créer dans la branche ${branch}`);
            return makeGithubPullRequest(branch, `Création de ${name}`);
        })
        .then((response) => {
            console.log(`Pull request pour la création de la fiche ${name} ouverte`);
            if (response.status !== 201 && response.data.html_url) {
                throw new Error('Il y a eu une erreur merci de recommencer plus tard')
            }
            return response.data
        }).catch((err) => {
            console.log(err);
            throw new Error(`Erreur Github lors de la mise à jour de la fiche de ${name}`);
        });
}

export async function createAuthorGithubFile(username: string, changes: GithubAuthorChange) : Promise<PRInfo> {
    const path = `content/_authors/${username}.md`;
    return createGithubCollectionEntry(username, path, changes)
}

export async function createStartupGithubFile(startupname: string, changes: GithubStartupChange, content: string) : Promise<PRInfo> {
    const path = `content/_startups/${startupname}.md`;
    return createGithubCollectionEntry(startupname, path, changes, content)
}
