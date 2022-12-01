import config from "@config";
import { addEvent, EventCode } from '@/lib/events'
import { updateAuthorGithubFile } from "./usersControllerUtils";
import betagouv from "@/betagouv";

export async function updateEndDateForUser(req, res) {
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
        const newEnd = req.body.newEnd || requiredError('nouvelle date de fin');

        const startDate = new Date(start);
        const newEndDate = isValidDate('nouvelle date de fin', new Date(newEnd));

        if (startDate && newEndDate) {
            if (newEndDate < startDate) {
                formValidationErrors.push('nouvelle date de fin : la date doit être supérieure à la date de début');
            }
        }

        if (formValidationErrors.length) {
            req.flash('error', formValidationErrors);
            throw new Error();
        }
        const info = await betagouv.userInfosById(username)
        const missions = info.missions
        missions[missions.length-1].end = newEnd
        const changes = { missions };
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
        req.flash('message', `Pull request pour la mise à jour de la fiche de ${username} ouverte <a href="${pullRequestsUrl}" target="_blank">ici</a>. Une fois mergée, votre profil sera mis à jour.`);
        res.redirect(`/community/${username}`);
    } catch (err) {
        console.error(err);
        req.flash('error', err.message);
        res.redirect(`/community/${username}`);
    }
}
