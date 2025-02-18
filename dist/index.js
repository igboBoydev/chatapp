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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
if (process.env.NODE_ENV !== "production") {
    dotenv_1.default.config();
}
const http_1 = require("http");
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const mongoose_2 = __importDefault(require("./database/mongoose"));
const redis_1 = require("redis");
const redis_2 = require("./database/redis");
const redisClient = (0, redis_1.createClient)();
redisClient.connect();
redisClient.on("error", (err) => console.error("Redis Error:", err));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
const users = {}; // { userId: socketId }
let MONGO_ENV = process.env.MONGO_ENV || "mongodb://localhost:27017/chatDB";
mongoose_1.default
    .connect(MONGO_ENV) // Replace with your actual DB URL
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Register user
    socket.on("register", (userId) => __awaiter(void 0, void 0, void 0, function* () {
        users[userId] = socket.id;
        console.log(`User registered: ${userId} -> ${socket.id}`);
        yield redisClient.set(`session:${userId}`, socket.id, {
            EX: 60 * 60 * 24 * 7,
        });
        socket.emit("sessionRegistered", { userId, sessionId: socket.id });
        const messages = yield mongoose_2.default.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
        }).sort({ timestamp: 1 });
        socket.emit("messageHistory", messages);
    }));
    // Handle private messaging
    socket.on("privateMessage", (data) => __awaiter(void 0, void 0, void 0, function* () {
        if (data.senderId === data.receiverId) {
            console.log({ message: "Cannot send message to self" });
            return;
        }
        console.log({
            senderId: data.senderId,
            receiverId: data.receiverId,
            message: data.message,
        });
        console.log(`Message from ${data.senderId} to ${data.receiverId}: ${data.message}`);
        console.log("-------------------------------- starting");
        // Publish message to Redis channel
        let resMessage = yield redis_2.redisPublisher.publish("messages", JSON.stringify(data));
        console.log("-------------------------------- started...");
        console.log({ resMessage });
        const newMessage = new mongoose_2.default({
            senderId: data.senderId,
            receiverId: data.receiverId,
            message: data.message,
            read: false,
        });
        let res1 = yield newMessage.save();
        console.log({ res1 });
        console.log("-------------------------------- end");
        const receiverSocketId = users[data.receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("message", {
                senderId: data.senderId,
                message: data.message,
            });
        }
        else {
            console.log(`User ${data.receiverId} not found.`);
        }
    }));
    socket.on("editMessage", (data) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Editing message:", data);
        try {
            const { messageId, newContent } = data;
            // Validate messageId
            if (!mongoose_1.default.Types.ObjectId.isValid(messageId)) {
                console.log("Invalid ObjectId format:", messageId);
                return;
            }
            // Perform update
            const updatedMessage = yield mongoose_2.default.findByIdAndUpdate(messageId, { message: newContent }, { new: true, runValidators: true } // Ensure updated data is returned and validated
            );
            console.log("MongoDB Update Result:", updatedMessage);
            if (!updatedMessage) {
                console.log("Message not found");
                return;
            }
            console.log("Message updated:", updatedMessage);
            // Publish update to Redis
            yield redis_2.redisPublisher.publish("messageUpdate", JSON.stringify(updatedMessage));
            // Notify both sender and receiver
            io.to(users[updatedMessage.senderId]).emit("messageEdited", {
                messageId,
                newContent,
            });
            io.to(users[updatedMessage.receiverId]).emit("messageEdited", {
                messageId,
                newContent,
            });
        }
        catch (error) {
            console.error("Error updating message:", error);
        }
    }));
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        Object.keys(users).forEach((userId) => __awaiter(void 0, void 0, void 0, function* () {
            if (users[userId] === socket.id) {
                console.log(`User ${userId} disconnected`);
                delete users[userId];
                // Keep session in Redis for reconnection
                // await redisClient.set(
                //   `session:${userId}`,
                //   socket.id,
                //   "EX",
                //   60 * 60 * 24 * 7
                // ); // 7 days expiry
            }
        }));
    }));
    // Reconnect users with active sessions
    socket.on("reconnectUser", (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const storedSocketId = yield redisClient.get(`session:${userId}`);
        if (storedSocketId) {
            users[userId] = socket.id;
            console.log(`User ${userId} reconnected -> ${socket.id}`);
        }
        else {
            console.log(`No active session found for ${userId}`);
        }
    }));
    // Logout user (clear session)
    socket.on("logout", (userId) => __awaiter(void 0, void 0, void 0, function* () {
        yield redisClient.del(`session:${userId}`);
        delete users[userId];
        console.log(`User ${userId} logged out`);
    }));
    socket.on("deleteMessage", (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log({ data });
            const { messageId } = data; // Extract messageId from the object
            if (!messageId) {
                console.log("Invalid messageId received");
                return;
            }
            console.log(`Deleting message with ID: ${messageId}`);
            // Ensure messageId is a valid MongoDB ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(messageId)) {
                console.log("Invalid ObjectId format");
                return;
            }
            const deletedMessage = yield mongoose_2.default.findByIdAndDelete(messageId);
            if (!deletedMessage) {
                console.log("Message not found");
                return;
            }
            // Publish deletion to Redis
            yield redis_2.redisPublisher.publish("messageDeleted", JSON.stringify({ messageId }));
            // Notify both sender and receiver
            io.to(users[deletedMessage.senderId]).emit("messageDeleted", messageId);
            io.to(users[deletedMessage.receiverId]).emit("messageDeleted", messageId);
        }
        catch (error) {
            console.error("Error deleting message:", error);
        }
    }));
    socket.on("messageRead", (messageId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log("Message received or read from socket");
            const updatedMessage = yield mongoose_2.default.findByIdAndUpdate(messageId, { read: true }, { new: true });
            if (updatedMessage) {
                console.log(`Message ${messageId} marked as read`);
                // Notify sender that message has been read
                io.to(users[updatedMessage.senderId]).emit("messageRead", {
                    messageId: updatedMessage._id,
                    receiverId: updatedMessage.receiverId,
                });
            }
        }
        catch (error) {
            console.error("Error updating message read status:", error);
        }
    }));
    socket.on("callUser", ({ to, signalData, from }) => {
        const receiverSocketId = users[to];
        if (receiverSocketId)
            io.to(receiverSocketId).emit("callIncoming", {
                signal: signalData,
                from,
            });
    });
    socket.on("answerCall", ({ signal, to }) => {
        io.to(users[to]).emit("callAccepted", signal);
    });
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
    // Handle disconnect
    socket.on("disconnect", () => {
        Object.keys(users).forEach((userId) => {
            if (users[userId] === socket.id) {
                console.log(`User ${userId} disconnected`);
                delete users[userId];
            }
        }); //7067212954
    });
});
// redisClient.subscribe("messages", async (message) => {
//   const data = JSON.parse(message);
//   console.log("Received message from Redis:", data);
//   // Save message in MongoDB
//   const newMessage = new Message(data);
//   await newMessage.save();
// });
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log({
        MONGO_ENV: process.env.MONGO_ENV,
        REDIS_URL_ENV: process.env.REDIS_URL_ENV,
        NODE_ENV: process.env.NODE_ENV,
    });
});
//# sourceMappingURL=index.js.map