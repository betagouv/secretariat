import { publishJobsToMattermost } from "@schedulers/syncBetagouvAPIScheduler/publishJobsToMattermost";

const args = process.argv.slice(2);
if (args[0]) {
  args[0] = JSON.parse(args[0]);
}

publishJobsToMattermost(args[0]).then(d => {
    console.log('Finished publish jobs to mattermost')
})