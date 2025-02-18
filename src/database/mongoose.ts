import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  senderId: string;
  receiverId: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model<IMessage>("Message", MessageSchema);
export default Message;
