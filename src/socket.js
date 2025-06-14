import { makeWASocket, DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import commandHandler from "./commands/index.js";
import setupCronJob from "./cron.js";

const { state, saveCreds } = await useMultiFileAuthState("./src/auth");

const connectToWhatsApp = async () => {
  const socket = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  socket.ev.on("connection.update", (update) => {
    console.log(update);

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
      setupCronJob(socket);
    }
  });

  socket.ev.on("creds.update", saveCreds); // Save creds to auth directory

  socket.ev.on("messages.upsert", (m) => commandHandler(socket, m));
};

export default connectToWhatsApp;
