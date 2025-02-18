import { createClient } from "redis";

const redisSubscriber = createClient();
const redisPublisher = createClient();
const redisClient = createClient();

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
