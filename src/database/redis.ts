import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL_ENV;

const redisSubscriber = createClient({ url: REDIS_URL });
const redisPublisher = createClient({ url: REDIS_URL });
const redisClient = createClient({ url: REDIS_URL });

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
