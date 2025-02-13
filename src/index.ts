import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

interface UserMap {
  [userId: string]: string;
}

const users: UserMap = {}; // { userId: socketId }

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register user
  socket.on("register", (userId: string) => {
    users[userId] = socket.id;
    console.log(`User registered: ${userId} -> ${socket.id}`);
  });

  // Handle private messaging
  socket.on(
    "privateMessage",
    (data: { senderId: string; receiverId: string; message: string }) => {
      if (data.senderId === data.receiverId) {
        console.log({ message: "Cannot send message to self" });
        return;
      }
      console.log({
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message,
      });
      console.log(
        `Message from ${data.senderId} to ${data.receiverId}: ${data.message}`
      );

      const receiverSocketId = users[data.receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message", {
          senderId: data.senderId,
          message: data.message,
        });
      } else {
        console.log(`User ${data.receiverId} not found.`);
      }
    }
  );

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
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
