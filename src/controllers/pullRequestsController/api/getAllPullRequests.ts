import config from "@/config";
import * as github from '@/lib/github';

export async function getAllPullRequests(req, res) {    
    try {
        const { data: pullRequests }  = await github.getPullRequests(
            config.githubOrganizationName, config.githubBetagouvTeam, req.params.status || 'open')
        res.json({
            pullRequests: pullRequests
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Impossible de récupérer les informations sur les pull requests ouvertes.'
        });
    }
}
  
