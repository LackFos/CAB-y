import GroupModel from "../../models/GroupModel.js";

export const getGroup = async (remoteJid) => {
  return await GroupModel.findOne({ remoteJid, isActive: true });
};
