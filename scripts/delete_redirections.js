require('dotenv').config();

const BetaGouv = require('../betagouv');

if (process.argv.length < 4) {
  console.log('Not enought arguments');
} else {
  const from = process.argv[2];
  const to = process.argv[3];
  console.log(`Delete ${from} to ${to}`);
  BetaGouv.deleteRedirection(from, to).then((result) => {
    console.log(result);
    console.log('Done');
  });
}
