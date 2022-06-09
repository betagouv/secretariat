import { sendMessageToTeamForJobOpenedForALongTime } from "../schedulers/syncBetagouvAPIScheduler"

sendMessageToTeamForJobOpenedForALongTime().then(() => {
    console.log('sendMessageToTeamForJobOpenedForALongTime hasrun')
})