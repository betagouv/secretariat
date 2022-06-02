import { syncBetagouvUserAPI } from "../schedulers/syncBetagouvAPIScheduler";

syncBetagouvUserAPI().then(d => {
    console.log('Sync betagouv user api done')
})
