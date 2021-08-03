import { moveUsersToAlumniTeam } from '../schedulers/mattermostScheduler';

const args = process.argv.slice(2);
if (args[0]) {
  args[0] = JSON.parse(args[0]);
}
// @ts-ignore
moveUsersToAlumniTeam(...args);
