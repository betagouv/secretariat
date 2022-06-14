import { buildChartBDD } from "../schedulers/syncBetagouvAPIScheduler";

buildChartBDD().then(() => {
    console.log('Build chart bdd has run')
})