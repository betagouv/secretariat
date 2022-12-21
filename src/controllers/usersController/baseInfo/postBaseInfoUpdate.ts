import { addEvent, EventCode } from '@/lib/events'
import { updateAuthorGithubFile } from "../usersControllerUtils";
import betagouv from "@/betagouv";
import { PRInfo } from "@/lib/github";
import db from "@/db";
import { PULL_REQUEST_TYPE, PULL_REQUEST_STATE } from "@/models/pullRequests";

export async function postBaseInfoUpdate(req, res) {
    const { username } = req.params;
    try {
        const formValidationErrors = [];

        function requiredError(field) {
            formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
        }

        function isValidDate(field, date) {
            if (date instanceof Date && !Number.isNaN(date.getTime())) {
                return date;
            }
            formValidationErrors.push(`${field} : la date n'est pas valide`);
            return null;
        }

        const { start, end } = req.body;
        const newEnd = req.body.end || requiredError('nouvelle date de fin');

        const startDate = new Date(start);
        const newEndDate = isValidDate('nouvelle date de fin', new Date(end));
        if (startDate && newEndDate) {
            if (newEndDate < startDate) {
                formValidationErrors.push('nouvelle date de fin : la date doit être supérieure à la date de début');
            }
        }

        if (formValidationErrors.length) {
            req.flash('error', formValidationErrors);
            throw new Error(formValidationErrors.toString());
        }
        const info = await betagouv.userInfosById(username)
        const missions = info.missions.map(mission => ({
            ...mission,
            end: mission.end ? new Date(mission.end) : undefined,
            start: mission.start ? new Date(mission.start) : undefined,
        }))
        missions[missions.length-1].end = newEndDate
        const changes = { missions, role: req.body.role, startups: req.body.startups };
        const prInfo : PRInfo = await updateAuthorGithubFile(username, changes);
        addEvent(EventCode.MEMBER_BASE_INFO_UPDATED, {
            created_by_username: req.auth.id,
            action_on_username: username,
            action_metadata: {
                value: newEnd,
                old_value: end,
            }
        })
        await db('pull_requests').insert({
            url: prInfo.html_url,
            username,
            type: PULL_REQUEST_TYPE.PR_MEMBER_UPDATE,
            status: PULL_REQUEST_STATE.PR_MEMBER_UPDATE_CREATED,
            info: JSON.stringify(changes)
        })
        // TODO: get actual PR url instead
        const message = `⚠️ Pull request pour la mise à jour de la fiche de ${username} ouverte. 
        \nDemande à un membre de ton équipe de merger ta fiche : <a href="${prInfo.html_url}" target="_blank">${prInfo.html_url}</a>. 
        \nUne fois mergée, ton profil sera mis à jour.`
        req.flash('message', message);
        res.json({
            message,
        });
    } catch (err) {
        console.log("ERROR", err.message),
        console.error(err);
        req.flash('error', err.message);
        res.redirect(`/account/base-info`);
    }
}
