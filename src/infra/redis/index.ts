import { config } from "dotenv";

config();

let RedisSMQ = require("rsmq");

// let QUEUENAME = "testqueue";
let NAMESPACE = "rsmq";

let raw_url = new URL(process.env.REDIS_URL);
let REDIS_HOST=raw_url.hostname;
let REDIS_PORT=raw_url.port;
let REDIS_PASSWORD=raw_url.password;

export const EventQueue = new RedisSMQ({
    host: REDIS_HOST,
    port: REDIS_PORT,
    ns: NAMESPACE,
    password: REDIS_PASSWORD
});

EventQueue.createQueue({qname: 'MarrainageIsDoingEvent'}, (err) => {
    if (err) {
        if (err.name !== "queueExists") {
            console.error(err);
            return;
        } else {
            console.log("The queue exists. That's OK.");
        }
    }
    console.log("queue created");
  });