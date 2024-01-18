import * as fs from "fs";
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";

const { state, saveCreds } = await useMultiFileAuthState("auth");

const connectToWhatsApp = async () => {
  const socket = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "Connection closed due to ",
        lastDisconnect.error,
        "reconnecting ",
        shouldReconnect
      );

      // Reconnect if not logged out manually by user
      if (shouldReconnect) {
        connectToWhatsApp();
      } else if (connection === "open") {
        console.log("opened connection");
      }
    }
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("messages.upsert", async (m) => {
    console.log(JSON.stringify(m, undefined, 2));
    if (m.messages[0].message.conversation === "!test") {
      await socket.sendMessage(m.messages[0].key.remoteJid, {
        text: "Ryan Kontol Anjing Memek",
      });
    }
  });
};

connectToWhatsApp();
