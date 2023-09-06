import BetaGouv from "../betagouv";

async function main() {
  if (process.argv.length !== 3) {
    console.error(`Usage: ${process.argv[1]} id-to-delete`);
    process.exit(1);
  }
  const idToDelete = process.argv[2];
  return await BetaGouv.deleteEmailForExchange(idToDelete);
}

main().then(console.log, console.error);
