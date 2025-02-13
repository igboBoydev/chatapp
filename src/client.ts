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
