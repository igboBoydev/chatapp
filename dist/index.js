"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
const users = {}; // { userId: socketId }
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    // Register user
    socket.on("register", (userId) => {
        users[userId] = socket.id;
        console.log(`User registered: ${userId} -> ${socket.id}`);
    });
    // Handle private messaging
    socket.on("privateMessage", (data) => {
        console.log(`Message from ${data.senderId} to ${data.receiverId}: ${data.message}`);
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
    });
    // Handle disconnect
    socket.on("disconnect", () => {
        Object.keys(users).forEach((userId) => {
            if (users[userId] === socket.id) {
                console.log(`User ${userId} disconnected`);
                delete users[userId];
            }
        });
    });
});
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map