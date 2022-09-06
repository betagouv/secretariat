import { config } from "dotenv";
import { IEventBus } from "../eventBus";

config();

const makeRedisEventBus = ({
  REDIS_URL
} : { REDIS_URL: string }) => {
  let RedisSMQ = require("rsmq");

  // let QUEUENAME = "testqueue";
  let NAMESPACE = "rsmq";

  let raw_url = new URL(REDIS_URL);
  let REDIS_HOST=raw_url.hostname;
  let REDIS_PORT=raw_url.port;
  let REDIS_PASSWORD=raw_url.password;
    
  const EventQueue = new RedisSMQ({
      host: REDIS_HOST,
      port: REDIS_PORT,
      ns: NAMESPACE,
      password: REDIS_PASSWORD
  });

  async function init(queueNames: string[]) {
      for (const queueName of queueNames) {
          EventQueue.createQueue({qname: queueName}, (err) => {
              if (err) {
                  if (err.name !== "queueExists") {
                      console.error(err);
                      return;
                  } else {
                      console.log("The queue exists. That's OK.");
                  }
              }
              console.info(`queue created : ${queueName}`);
          });
      }
  }

  async function produce(eventMessageType, params) {

      return EventQueue.sendMessage({
          qname: eventMessageType,
          message: JSON.stringify(params),
          delay: 0
      }, (err) => {
          if (err) {
              console.error(`queue ${eventMessageType} : ${err}`);
              return;
          }
      });
    }
    
    async function consume(eventMessageType, messageHandler) {
      // check for new messages on a delay
      console.log(`Checking for job in queue ${eventMessageType}`);
      return EventQueue.receiveMessage({ qname: eventMessageType }, async (err, resp) => {
        if (err) {
          console.error(`queue ${eventMessageType} : ${err}`);
          return;
        }
        if (resp.id) {
          const message = JSON.parse(resp.message)
          await messageHandler(message)
          // do lots of processing here
          // when we are done we can delete it
          EventQueue.deleteMessage({ qname: eventMessageType, id: resp.id }, (err) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log("deleted message with id", resp.id);
          });
        } else {
          console.log("no message in queue");
        }
  })};

  const RedisConfig : IEventBus = {
    init: init,
    produce: produce,
    consume: consume,
  }
  return RedisConfig
}



export default makeRedisEventBus;
