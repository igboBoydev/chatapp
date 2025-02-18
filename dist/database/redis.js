"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.redisPublisher = exports.redisSubscriber = void 0;
const redis_1 = require("redis");
let REDIS_URL = process.env.RED_URL_ENV;
let redisSubscriber;
let redisPublisher;
let redisClient;
if (process.env.NODE_ENV === "production") {
    // @ts-ignore mesage
    // REDIS_URL = process.env.REDIS_URL_ENV;
    exports.redisSubscriber = redisSubscriber = (0, redis_1.createClient)({ url: REDIS_URL });
    exports.redisPublisher = redisPublisher = (0, redis_1.createClient)({ url: REDIS_URL });
    exports.redisClient = redisClient = (0, redis_1.createClient)({ url: REDIS_URL });
}
else {
    exports.redisSubscriber = redisSubscriber = (0, redis_1.createClient)();
    exports.redisPublisher = redisPublisher = (0, redis_1.createClient)();
    exports.redisClient = redisClient = (0, redis_1.createClient)();
}
// Async function to connect Redis clients
function connectRedis() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield redisSubscriber.connect();
            console.log("✅ Redis Subscriber Connected");
            yield redisPublisher.connect();
            console.log("✅ Redis Publisher Connected");
        }
        catch (error) {
            console.error("❌ Redis Connection Error:", error);
        }
    });
}
// Call the function to connect Redis
connectRedis();
//# sourceMappingURL=redis.js.map