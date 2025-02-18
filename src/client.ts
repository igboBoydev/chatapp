import io from "socket.io-client";
import * as readline from "readline";

const socket = io("http://localhost:3000");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter your user ID: ", (userId: string) => {
  socket.emit("register", userId);

  rl.on("line", (input: string) => {
    const [receiverId, ...messageParts] = input.split(" ");
    const message = messageParts.join(" ");

    socket.emit("privateMessage", { senderId: userId, receiverId, message });
  });
});

socket.on("message", (data: { senderId: string; message: string }) => {
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
