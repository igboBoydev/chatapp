import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import Message from "./database/mongoose";
import { createClient } from "redis";
import { redisPublisher } from "./database/redis";

const redisClient = createClient();
redisClient.connect();

redisClient.on("error", (err) => console.error("Redis Error:", err));

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

mongoose
  .connect(
    "mongodb+srv://kunlethompson2:MWxmLIykHbnOzAAS@paydb.3mvwp.mongodb.net/test"
  ) // Replace with your actual DB URL
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

io.on("connection", (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register user
  socket.on("register", async (userId: string) => {
    users[userId] = socket.id;
    console.log(`User registered: ${userId} -> ${socket.id}`);

    await redisClient.set(`session:${userId}`, socket.id, {
      EX: 60 * 60 * 24 * 7,
    });

    socket.emit("sessionRegistered", { userId, sessionId: socket.id });

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ timestamp: 1 });

    socket.emit("messageHistory", messages);
  });

  // Handle private messaging
  socket.on(
    "privateMessage",
    async (data: { senderId: string; receiverId: string; message: string }) => {
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

      // Publish message to Redis channel
      await redisPublisher.publish("messages", JSON.stringify(data));

      const newMessage = new Message({
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message,
        read: false,
      });
      await newMessage.save();

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

  socket.on(
    "editMessage",
    async (data: { messageId: string; newContent: string }) => {
      console.log("Editing message:", data);

      try {
        const { messageId, newContent } = data;

        // Validate messageId
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
          console.log("Invalid ObjectId format:", messageId);
          return;
        }

        // Perform update
        const updatedMessage = await Message.findByIdAndUpdate(
          messageId,
          { message: newContent },
          { new: true, runValidators: true } // Ensure updated data is returned and validated
        );

        console.log("MongoDB Update Result:", updatedMessage);

        if (!updatedMessage) {
          console.log("Message not found");
          return;
        }

        console.log("Message updated:", updatedMessage);

        // Publish update to Redis
        await redisPublisher.publish(
          "messageUpdate",
          JSON.stringify(updatedMessage)
        );

        // Notify both sender and receiver
        io.to(users[updatedMessage.senderId]).emit("messageEdited", {
          messageId,
          newContent,
        });
        io.to(users[updatedMessage.receiverId]).emit("messageEdited", {
          messageId,
          newContent,
        });
      } catch (error) {
        console.error("Error updating message:", error);
      }
    }
  );

  socket.on("disconnect", async () => {
    Object.keys(users).forEach(async (userId) => {
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
    });
  });

  // Reconnect users with active sessions
  socket.on("reconnectUser", async (userId) => {
    const storedSocketId = await redisClient.get(`session:${userId}`);
    if (storedSocketId) {
      users[userId] = socket.id;
      console.log(`User ${userId} reconnected -> ${socket.id}`);
    } else {
      console.log(`No active session found for ${userId}`);
    }
  });

  // Logout user (clear session)
  socket.on("logout", async (userId) => {
    await redisClient.del(`session:${userId}`);
    delete users[userId];
    console.log(`User ${userId} logged out`);
  });

  socket.on("deleteMessage", async (data: { messageId: string }) => {
    try {
      console.log({ data });
      const { messageId } = data; // Extract messageId from the object
      if (!messageId) {
        console.log("Invalid messageId received");
        return;
      }

      console.log(`Deleting message with ID: ${messageId}`);

      // Ensure messageId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        console.log("Invalid ObjectId format");
        return;
      }

      const deletedMessage = await Message.findByIdAndDelete(messageId);

      if (!deletedMessage) {
        console.log("Message not found");
        return;
      }

      // Publish deletion to Redis
      await redisPublisher.publish(
        "messageDeleted",
        JSON.stringify({ messageId })
      );

      // Notify both sender and receiver
      io.to(users[deletedMessage.senderId]).emit("messageDeleted", messageId);
      io.to(users[deletedMessage.receiverId]).emit("messageDeleted", messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

  socket.on("messageRead", async (messageId: string) => {
    try {
      console.log("Message received or read from socket");
      const updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { read: true },
        { new: true }
      );

      if (updatedMessage) {
        console.log(`Message ${messageId} marked as read`);

        // Notify sender that message has been read
        io.to(users[updatedMessage.senderId]).emit("messageRead", {
          messageId: updatedMessage._id,
          receiverId: updatedMessage.receiverId,
        });
      }
    } catch (error) {
      console.error("Error updating message read status:", error);
    }
  });

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
});
