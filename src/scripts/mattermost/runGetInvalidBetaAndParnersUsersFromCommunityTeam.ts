import { getInvalidBetaAndParnersUsersFromCommunityTeam } from "@/schedulers/mattermostScheduler/mattermostScheduler"

const args = process.argv.slice(2);
let params = {
    nbDays: undefined
}
if (args[0]) {
  params = JSON.parse(args[0]);
}

getInvalidBetaAndParnersUsersFromCommunityTeam({
    nbDays: params.nbDays || 90
}).then(() => {
    console.log('Done')
})