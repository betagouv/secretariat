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

    async function _consumeLastMessage(eventMessageType, messageHandler) {
      try {
        const resp = await EventQueue.receiveMessageAsync({ qname: eventMessageType, vt: 60 * 15 })
        if (resp.id) {
          console.log(`Queue ${eventMessageType} dealing with ${resp.message}`)
          try {
            const message = JSON.parse(resp.message)
            await messageHandler(message)
            // do lots of processing here
            // when we are done we can delete it
            await EventQueue.deleteMessageAsync({ qname: eventMessageType, id: resp.id })
            console.log("deleted message with id", resp.id);
          } catch (e) {
            console.error(`Error while dealing with message ${resp.message} : ${e}`)
          }
        } else {
          console.log("no message in queue");
        }
        return resp.id
      } catch (err) {
        console.error(`queue ${eventMessageType} : ${err}`);
        return
      }
    }
    
    async function consume(eventMessageType, messageHandler) {
      // check for new messages on a delay
      let newMessage = true
      let count = 0;
      console.log(`=== Start checking for jobs in queue ${eventMessageType} ===`);
      while (newMessage) {
        newMessage = await _consumeLastMessage(eventMessageType, messageHandler)
        if (newMessage) {
          count = count + 1
        }
      }
      console.log(`=== End checking for jobs in queue ${eventMessageType} : ${count} mss ===`);
    };

  const RedisConfig : IEventBus = {
    init: init,
    produce: produce,
    consume: consume,
  }
  return RedisConfig
}



export default makeRedisEventBus;
