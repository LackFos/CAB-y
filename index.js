import dotenv from "dotenv";
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import initializeCommands from "./src/commands.js";
import initializeCrons from "./src/cron.js";

dotenv.config();

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
      initializeCrons();
    }
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("messages.upsert", async (m) => {
    initializeCommands(socket, m);
  });
};

connectToWhatsApp();
