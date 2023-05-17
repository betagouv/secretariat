import { createClient } from "redis"
import session from 'express-session';
import connectRedis from 'connect-redis';
import config from "@/config";

const makeSessionStore = () => {
  let redisClient = createClient({
    url: config.REDIS_URL
  })
  redisClient.on('error', (err) => {
      console.log('Redis error: ', err);
  })

  redisClient.on("ready", () => {
    console.log('✅ 💃 redis have ready !')
  })

  redisClient.on("connect", () => {
    console.log('✅ 💃 connect redis success !')
  })
        
  const RedisStore = connectRedis(session)
  // Initialize store.
  return new RedisStore({
    client: redisClient,
    prefix: "cookiestore:",
  })
}
// Initialize client.

export default makeSessionStore
