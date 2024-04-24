import {
  banUserFromGroup,
  muteUserFromGroup,
  unbanUserFromGroup,
  unmuteUserFromGroup,
} from "../controllers/groups/updateGroup.js";
import { regexValidator } from "../utils/regexValidator.js";

export const initializeAdminCommand = async (socket, message) => {
  try {
    if (message.text.startsWith(".ban")) {
      if (message.text !== ".ban") {
        const commandRegex = /\.ban\s+@\d+/g;
        await regexValidator(message.text, commandRegex);
      }

      const userToBan = message.mentionedJid[0] ? message.mentionedJid[0] : message.quoted.participant; // prettier-ignore
      const userToBanNumber = userToBan.replace("@s.whatsapp.net", ""); // prettier-ignore
      const isUserBanned = await banUserFromGroup(message.remoteJid, userToBan); // prettier-ignore

      const response = isUserBanned
        ? `*@${userToBanNumber} berhasil diban*`
        : `*@${userToBanNumber} telah diban sebelumnya*`;

      return await socket.sendMessage(
        message.remoteJid,
        { text: response, mentions: [userToBan] },
        { quoted: message.ref }
      );
    }

    if (message.text.startsWith(".unban")) {
      if (message.text !== ".unban") {
        const commandRegex = /\.unban\s+@\d+/g;
        await regexValidator(message.text, commandRegex);
      }

      const userToUnban = message.mentionedJid[0] ? message.mentionedJid[0] : message.quoted.participant; // prettier-ignore
      const userToUnbanNumber = userToUnban.replace("@s.whatsapp.net", ""); // prettier-ignore
      const isUserUnbanned = await unbanUserFromGroup(message.remoteJid, userToUnban); // prettier-ignore

      const response = isUserUnbanned
        ? `*Ban @${userToUnbanNumber} telah dicopot*`
        : `*@${userToUnbanNumber} tidak diban sebelumnya*`;

      return await socket.sendMessage(
        message.remoteJid,
        { text: response, mentions: [userToUnban] },
        { quoted: message.ref }
      );
    }

    if (message.text.startsWith(".mute")) {
      if (message.text !== ".mute") {
        const commandRegex = /\.mute\s+@\d+/g;
        await regexValidator(message.text, commandRegex);
      }

      const userToMute = message.mentionedJid[0] ? message.mentionedJid[0] : message.quoted.participant; // prettier-ignore
      const userToMuteNumber = userToMute.replace("@s.whatsapp.net", ""); // prettier-ignore
      const isUserMuted = await muteUserFromGroup(message.remoteJid, userToMute); // prettier-ignore

      const response = isUserMuted
        ? `*@${userToMuteNumber} berhasil dimute*`
        : `*@${userToMuteNumber} telah dimute sebelumnya*`;

      return await socket.sendMessage(
        message.remoteJid,
        { text: response, mentions: [userToMute] },
        { quoted: message.ref }
      );
    }

    if (message.text.startsWith(".unmute")) {
      if (message.text !== ".unmute") {
        const commandRegex = /\.unmute\s+@\d+/g;
        await regexValidator(message.text, commandRegex);
      }

      const userToMute = message.mentionedJid[0] ? message.mentionedJid[0] : message.quoted.participant; // prettier-ignore
      const userToMuteNumber = userToMute.replace("@s.whatsapp.net", ""); // prettier-ignore
      const isUserMuted = await unmuteUserFromGroup(message.remoteJid, userToMute); // prettier-ignore

      const response = isUserMuted
        ? `*Mute @${userToMuteNumber} telah dicopot*`
        : `*@${userToMuteNumber} telah dimute sebelumnya*`;

      return await socket.sendMessage(
        message.remoteJid,
        { text: response, mentions: [userToMute] },
        { quoted: message.ref }
      );
    }
  } catch (error) {
    return await socket.sendMessage(
      message.remoteJid,
      { text: `Error: ${error.message}` },
      { quoted: message.ref }
    );
  }
};
