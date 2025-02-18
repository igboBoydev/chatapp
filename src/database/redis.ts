import { createClient, RedisClientType } from "redis";

let REDIS_URL = process.env.RED_URL_ENV;

let redisSubscriber: RedisClientType;
let redisPublisher: RedisClientType;
let redisClient: RedisClientType;
if (process.env.NODE_ENV === "production") {
  // @ts-ignore mesage
  // REDIS_URL = process.env.REDIS_URL_ENV;
  redisSubscriber = createClient({ url: REDIS_URL });
  redisPublisher = createClient({ url: REDIS_URL });
  redisClient = createClient({ url: REDIS_URL });
} else {
  redisSubscriber = createClient();
  redisPublisher = createClient();
  redisClient = createClient();
}

// Async function to connect Redis clients
async function connectRedis() {
  try {
    await redisSubscriber.connect();
    console.log("✅ Redis Subscriber Connected");

    await redisPublisher.connect();
    console.log("✅ Redis Publisher Connected");
  } catch (error) {
    console.error("❌ Redis Connection Error:", error);
  }
}

// Call the function to connect Redis
connectRedis();

export { redisSubscriber, redisPublisher, redisClient };
