import { buildCommunityBDD } from "@schedulers/syncBetagouvAPIScheduler";

buildCommunityBDD().then(() => {
    console.log('Build community bdd has run')
})