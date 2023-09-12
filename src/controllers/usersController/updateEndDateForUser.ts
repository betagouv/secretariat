import config from "@config";
import { addEvent, EventCode } from '@/lib/events'
import { requiredError, isValidDate } from "@controllers/validator"

import betagouv from "@/betagouv";
import { updateAuthorGithubFile } from "../helpers/githubHelpers";
import { GithubAuthorChange } from "../helpers/githubHelpers/githubEntryInterface";

export async function updateEndDateForUser(req, res) {
    const { username } = req.params;

    try {
        const formValidationErrors = {};
        const errorHandler = (field, message) => {
            const errorMessagesForKey = []
            // get previous message
            if (formValidationErrors[field]) {
                errorMessagesForKey.push(formValidationErrors[field])
            }
            // add new message to array
            errorMessagesForKey.push(message)
            // make it one message
            formValidationErrors[field] = errorMessagesForKey.join(',')
        }

        const { start, end } = req.body;
        const newEnd = req.body.newEnd || requiredError('nouvelle date de fin', errorHandler);

        const startDate = new Date(start);
        const newEndDate = isValidDate('nouvelle date de fin', new Date(newEnd), errorHandler);

        if (startDate && newEndDate) {
            if (newEndDate < startDate) {
                errorHandler('nouvelle date de fin', 'La date doit être supérieure à la date de début');
            }
        }

        if (Object.keys(formValidationErrors).length) {
            req.flash('error', formValidationErrors);
            throw new Error();
        }
        const info = await betagouv.userInfosById(username)
        const missions = info.missions.map(mission => ({
            ...mission,
            end: mission.end ? new Date(mission.end) : undefined,
            start: mission.start ? new Date(mission.start) : undefined,
        }))
        missions[missions.length-1].end = newEndDate
        const changes : GithubAuthorChange = { missions };
        await updateAuthorGithubFile(username, changes);
        addEvent(EventCode.MEMBER_END_DATE_UPDATED, {
            created_by_username: req.auth.id,
            action_on_username: username,
            action_metadata: {
                value: newEnd,
                old_value: end,
            }
        })
        // TODO: get actual PR url instead
        const pullRequestsUrl = `https://github.com/${config.githubRepository}/pulls`;
        req.flash('message', `⚠️ Pull request pour la mise à jour de la fiche de ${username} ouverte. 
        \nDemande à un membre de ton équipe de merger ta fiche : <a href="${pullRequestsUrl}" target="_blank">${pullRequestsUrl}</a>. 
        \nUne fois mergée, ton profil sera mis à jour.`);
        res.redirect(`/community/${username}`);
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect(`/community/${username}`);
    }
}
