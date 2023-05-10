import { createClient } from "redis"
import session from 'express-session';
import connectRedis from 'connect-redis';
import config from "@/config";

// Initialize client.
let redisClient = createClient({
    url: config.REDIS_URL
})
redisClient.on('error', (err) => {
    console.log('Redis error: ', err);
});
      
const RedisStore = connectRedis(session)
// Initialize store.
let sessionStore = new RedisStore({
  client: redisClient,
  prefix: "cookiestore:",
})

export default sessionStore
