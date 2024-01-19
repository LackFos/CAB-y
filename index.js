import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import cryptoCurrencyAPI from "./src/api/cryptoCurrency.js";
import toIDR from "./src/utils/toIDR.js";
import toPercent from "./src/utils/toPercent.js";
import dateTime from "./src/utils/datetime.js";
import abbreviateNumber from "./src/utils/abbreviateNumber.js";

const { state, saveCreds } = await useMultiFileAuthState("./src/auth");

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
    const message = m.messages[0].message;
    const messageText =
      message?.extendedTextMessage?.text ?? message?.conversation;

    const messageAddress = m.messages[0].key.remoteJid;

    console.log(m.messages[0].message);
    if (!messageText) {
      return;
    }

    if (messageText === ".ping") {
      await socket.sendMessage(messageAddress, {
        text: `*Bot Aktif*`,
      });
    }

    if (messageText.startsWith(".price ")) {
      const symbol = messageText.split(" ")[1].toUpperCase();
      const result = await cryptoCurrencyAPI.find(symbol);
      const data = result.data[symbol];

      if (data.length !== 0) {
        const item = result.data[symbol][0];
        const percentChange = item.quote.IDR.percent_change_24h;
        const percentIndicator = percentChange < 0 ? "📉" : "📈";

        await socket.sendMessage(messageAddress, {
          text: `*${item.name} (${
            item.symbol
          })*\n${percentIndicator} ${toPercent(
            percentChange
          )} (24 Jam)\n\n💰 Harga : *${toIDR(
            item.quote.IDR.price
          )}*\n📊 Volume (24 Jam) : *${abbreviateNumber(
            item.quote.IDR.volume_24h
          )}*\n📑 Marketcap : *${abbreviateNumber(
            item.quote.IDR.market_cap
          )}*\n\n_${dateTime(item.quote.IDR.last_updated)}_`,
        });
      } else {
        await socket.sendMessage(messageAddress, {
          text: `Tidak ada barang yang bernama ${symbol}`,
        });
      }
    }
  });
};

connectToWhatsApp();
