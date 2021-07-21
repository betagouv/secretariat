import {betaOVH} from "../betagouv";

import { config } from "dotenv";

config();

if (process.argv.length < 4) {
  console.log('Not enought arguments');
} else {
  const from = process.argv[2];
  const to = process.argv[3];
  console.log(`Delete ${from} to ${to}`);
  betaOVH.deleteRedirection(from, to).then((result) => {
    console.log('Done');
  });
}
