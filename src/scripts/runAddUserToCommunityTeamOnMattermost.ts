import { addUsersNotInCommunityToCommunityTeam } from "@schedulers/mattermostScheduler";
addUsersNotInCommunityToCommunityTeam().then(() => {
    console.log('Done')
})
