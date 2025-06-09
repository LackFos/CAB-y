import { model, Schema } from "mongoose";

const groupSchema = new Schema(
  {
    remoteJid: { type: String, unique: true },
    name: { type: String },
    admins: { type: [String] },
    bannedUsers: { type: [String] },
    mutedUsers: { type: [String] },
    isActive: { type: Boolean },
  },
  {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  }
);

const GroupModel = model("Group", groupSchema);

export default GroupModel;
