import cron from "node-cron";
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import commandHandler from "./commands/index.js";
import { getWalletSummary } from "./controllers/wallets/getWallet.js";
import GroupModel from "./models/GroupModel.js";
import { walletSummaryResponse } from "./utils/helpers/responseHelper.js";

const { state, saveCreds } = await useMultiFileAuthState("./src/auth");

const connectToWhatsApp = async () => {
  const socket = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed due to ", lastDisconnect.error, "reconnecting ", shouldReconnect);

      // Reconnect if not logged out manually by user
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("opened connection");

      cron.schedule("0 */2 * * *", async () => {
        const groups = await GroupModel.find();
        const sendableGroups = groups.filter((group) => group.isActive === true);

        sendableGroups.forEach(async (group) => {
          const { participants } = await socket.groupMetadata(group.remoteJid);

          participants.forEach(async (participant) => {
            try {
              const wallet = await getWalletSummary(participant.id);
              const summary = walletSummaryResponse(wallet);
              await socket.sendMessage(group.remoteJid, { text: summary });
            } catch (error) {
              console.log(error);
            }
          });
        });
      });
    }
  });

  socket.ev.on("creds.update", saveCreds); // Save creds to auth directory

  socket.ev.on("messages.upsert", (m) => commandHandler(socket, m));
};

export default connectToWhatsApp;
