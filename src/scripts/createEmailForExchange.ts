import BetaGouv from "../betagouv";

async function main() {
  if (process.argv.length < 3) {
    console.error(`Usage: ${process.argv[1]} id-to-create '{ "company":... }'`);
    process.exit(1);
  }
  const idToCreate = process.argv[2];
  const creationData = process.argv[3] ? JSON.parse(process.argv[3]) : {};
  await BetaGouv.createEmailForExchange(idToCreate, creationData);
}

main().catch(console.error);
