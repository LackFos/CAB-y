import GroupModel from "../../models/GroupModel.js";

export const banUserFromGroup = async (remoteJid, user) => {
  const isUserBanned = await GroupModel.findOne({
    remoteJid,
    bannedUsers: user,
  });

  if (!isUserBanned) {
    return await GroupModel.findOneAndUpdate(
      { remoteJid },
      { $push: { bannedUsers: user } },
      { new: true }
    );
  }
};

export const unbanUserFromGroup = async (remoteJid, user) => {
  const isUserBanned = await GroupModel.findOne({
    remoteJid,
    bannedUsers: user,
  });

  if (isUserBanned) {
    return await GroupModel.findOneAndUpdate(
      { remoteJid },
      { $pull: { bannedUsers: user } },
      { new: true }
    );
  }
};

export const muteUserFromGroup = async (remoteJid, user) => {
  const isUserMuted = await GroupModel.findOne({
    remoteJid,
    mutedUsers: user,
  });

  if (!isUserMuted) {
    return await GroupModel.findOneAndUpdate(
      { remoteJid },
      { $push: { mutedUsers: user } },
      { new: true }
    );
  }
};

export const unmuteUserFromGroup = async (remoteJid, user) => {
  const isUserMuted = await GroupModel.findOne({
    remoteJid,
    mutedUsers: user,
  });

  if (isUserMuted) {
    return await GroupModel.findOneAndUpdate(
      { remoteJid },
      { $pull: { mutedUsers: user } },
      { new: true }
    );
  }
};
