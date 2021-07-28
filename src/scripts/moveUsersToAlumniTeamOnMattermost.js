const { moveUsersToAlumniTeam } = require('../schedulers/mattermostScheduler');

const args = process.argv.slice(2);
if (args[1]) {
  args[1] = JSON.parse(args[1]);
}
moveUsersToAlumniTeam(...args);
