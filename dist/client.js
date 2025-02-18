"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const readline = __importStar(require("readline"));
const socket = (0, socket_io_client_1.default)("http://localhost:3000");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
rl.question("Enter your user ID: ", (userId) => {
    socket.emit("register", userId);
    rl.on("line", (input) => {
        const [receiverId, ...messageParts] = input.split(" ");
        const message = messageParts.join(" ");
        socket.emit("privateMessage", { senderId: userId, receiverId, message });
    });
});
socket.on("message", (data) => {
    console.log(`\n📩 New message from ${data.senderId}: ${data.message}`);
});
// import express from "express";
// import { createServer } from "http";
// import mongoose from "mongoose";
// import { Server, Socket } from "socket.io";
// const app = express();
// const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//   },
// });
// interface UserMap {
//   [userId: string]: string;
// }
// const users: UserMap = {}; // { userId: socketId }
// io.on("connection", (socket: Socket) => {
//   console.log(`User connected: ${socket.id}`);
//   // Register user
//   socket.on("register", (userId: string) => {
//     users[userId] = socket.id;
//     console.log(`User registered: ${userId} -> ${socket.id}`);
//   });
//   // Handle private messaging
//   socket.on(
//     "privateMessage",
//     (data: { senderId: string; receiverId: string; message: string }) => {
//       if (data.senderId === data.receiverId) {
//         console.log({ message: "Cannot send message to self" });
//         return;
//       }
//       console.log({
//         senderId: data.senderId,
//         receiverId: data.receiverId,
//         message: data.message,
//       });
//       console.log(
//         `Message from ${data.senderId} to ${data.receiverId}: ${data.message}`
//       );
//       const receiverSocketId = users[data.receiverId];
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("message", {
//           senderId: data.senderId,
//           message: data.message,
//         });
//       } else {
//         console.log(`User ${data.receiverId} not found.`);
//       }
//     }
//   );
//   socket.on("callUser", ({ to, signalData, from }) => {
//     const receiverSocketId = users[to];
//     if (receiverSocketId)
//       io.to(receiverSocketId).emit("callIncoming", {
//         signal: signalData,
//         from,
//       });
//   });
//   socket.on("answerCall", ({ signal, to }) => {
//     io.to(users[to]).emit("callAccepted", signal);
//   });
//   // Handle disconnection
//   socket.on("disconnect", () => {
//     console.log(`User disconnected: ${socket.id}`);
//   });
//   // Handle disconnect
//   socket.on("disconnect", () => {
//     Object.keys(users).forEach((userId) => {
//       if (users[userId] === socket.id) {
//         console.log(`User ${userId} disconnected`);
//         delete users[userId];
//       }
//     }); //7067212954
//   });
// });
// const PORT = 3000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
//# sourceMappingURL=client.js.map