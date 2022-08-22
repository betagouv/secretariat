import { syncBetagouvStartupAPI } from "@schedulers/syncBetagouvAPIScheduler"

syncBetagouvStartupAPI().then(() => {
    console.log('Sync betagouv startup api has run')
})
