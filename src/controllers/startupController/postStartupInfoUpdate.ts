import { addEvent, EventCode } from '@/lib/events'
import betagouv from "@/betagouv";
import { PRInfo } from "@/lib/github";
import db from "@/db";
import { PULL_REQUEST_TYPE, PULL_REQUEST_STATE } from "@/models/pullRequests";
import { isValidDate, requiredError } from '@/controllers/validator';
import { StartupInfo, StartupPhase } from '@/models/startup';
import { GithubStartupChange, updateStartupGithubFile } from '@/controllers/helpers/githubHelpers/updateGithubFile';

const isValidPhase = (field, value, callback) => {
    if (Object.values(StartupPhase).includes(value)) {
        return
    }
    callback(field, `La phase n'as pas une valeur valide`)
    return
}

export async function postStartupInfoUpdate(req, res) {
    const { startup } = req.params;
    
    try {
        const formValidationErrors = {};
        const errorHandler = (field, message) => {
            const errorMessagesForKey = formValidationErrors[field] || []
            // add new message to array
            errorMessagesForKey.push(message)
            // make it one message
            formValidationErrors[field] = errorMessagesForKey
        }
        const phase = req.body.phase || requiredError('phase', errorHandler)
        isValidPhase('phase', phase, errorHandler) 

        const date = req.body.date || requiredError('date', errorHandler)
        isValidDate('date', new Date(date), errorHandler)

        const content = req.body.text

        const dateInDateFormat = new Date(date)

        if (Object.keys(formValidationErrors).length) {
            throw new Error('Erreur dans le formulaire', { cause: formValidationErrors });
        }
 
        const startupsInfos = await betagouv.startupsInfos()
        const info : StartupInfo = startupsInfos.find(s => s.id === startup)
        if (!info) {
            res.status(404).json({
                message: "La startup indiqué n'existe pas"
            })
        }
        const phases = info.attributes.phases.map(phase => ({
            ...phase,
            end: phase.end ? new Date(phase.end) : undefined,
            start: phase.start ? new Date(phase.start) : undefined,
        }))
        phases[phases.length-1].end = dateInDateFormat
        phases.push({
            name: phase,
            start: dateInDateFormat,
            end: undefined
        })
        const changes : GithubStartupChange = { phases };
        const prInfo : PRInfo = await updateStartupGithubFile(startup, changes, content);
        addEvent(EventCode.STARTUP_PHASE_UPDATED, {
            created_by_username: req.auth.id,
            action_metadata: { 
                value: {
                    phase: phase,
                    date,
                }
            }
        })
        await db('pull_requests').insert({
            url: prInfo.html_url,
            startup: startup,
            type: PULL_REQUEST_TYPE.PR_TYPE_STARTUP_UPDATE,
            status: PULL_REQUEST_STATE.PR_STARTUP_UPDATE_CREATED,
            info: JSON.stringify(changes)
        })
        const message = `⚠️ Pull request pour la mise à jour de la fiche de ${startup} ouverte. 
        \nUn membre de l'equipe doit merger la fiche : <a href="${prInfo.html_url}" target="_blank">${prInfo.html_url}</a>. 
        \nUne fois mergée, la fiche sera mis à jour dans les 10 minutes.`
        req.flash('message', message);
        res.json({
            message,
            pr_url: prInfo.html_url
        });
    } catch (err) {
        console.error(err)
        res.status(400).json({
            message: err.message,
            errors: err.cause,
        });
    }
}
