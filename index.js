import cron from "node-cron";
import dotenv from "dotenv";
import { promises as fsPromises } from "fs";
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";
import WalletController from "./src/controller/WalletController.js";
import toIDR from "./src/utils/toIDR.js";
import toPercent from "./src/utils/toPercent.js";
import dateTime from "./src/utils/datetime.js";
import commaToDecimal from "./src/utils/commaToDecimal.js";
import abbreviateNumber from "./src/utils/abbreviateNumber.js";
import MessageBuilder from "./src/helpers/MessageBuilder.js";
import cryptoCurrencyAPI from "./src/api/cryptoCurrency.js";
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

      cron.schedule("0 * * * *", async () => {
        const filePath = "./src/database/wallet.json";
        const fileData = await fsPromises.readFile(filePath);
        const data = JSON.parse(fileData);

        for (let user in data) {
          const userPhoneNumber = user.split("@")[0];
          const userWallet = new WalletController(user);
          await userWallet.initializeWallet();

          if (userWallet.items?.length <= 0) {
            continue;
          }

          const { investedCapital, portfolio, portfolioValue, percentChange } = await userWallet.getPortfolio();
          const percentIndicator = percentChange === 0 ? "" : percentChange > 0 ? "📈" : "📉";

          const messageBuilder = new MessageBuilder();
          messageBuilder.append(`*Portfolio @${userPhoneNumber}*`, 2);

          portfolio.forEach((item) => {
            const { symbol, itemCount, pricePerItem, currentValue } = item;

            const percentChange = ((currentValue - pricePerItem) / pricePerItem) * 100;
            const percentIndicator = percentChange === 0 ? "" : percentChange > 0 ? "📈" : "📉";
            messageBuilder.append(
              `${itemCount.toLocaleString("id-ID")} ${symbol} - *${toIDR(
                itemCount * currentValue
              )}* (${percentIndicator}${toPercent(percentChange)})`
            );
          });
          messageBuilder.newLine();
          messageBuilder.append(
            `Nilai Investasi : *${toIDR(portfolioValue)}* (${percentIndicator}${toPercent(percentChange)})`
          );
          messageBuilder.append(`Perubahan : *${toIDR(portfolioValue - investedCapital)}*`);
          messageBuilder.append(`Modal Investasi : *${toIDR(investedCapital)}*`, 0);

          await socket.sendMessage(process.env.GROUP_ID, { text: messageBuilder.text, mentions: [user] });
        }
      });
    }
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("messages.upsert", async (m) => {
    console.log(JSON.stringify(m, undefined, 2));
    const { key, message } = m.messages[0];
    const jid = key.remoteJid;
    const sender = key.participant;
    const messageText = message?.extendedTextMessage?.text ?? message?.conversation;
    // Revert if Message Body Not Found
    if (!messageText) {
      return;
    }

    // .ping: Checks the bot's connection status.
    if (messageText === ".ping") {
      await socket.sendMessage(jid, {
        text: `*Bot Aktif*`,
      });
    }

    if (messageText === ".all") {
      const groupMeta = await socket.groupMetadata(process.env.GROUP_ID);
      const participantsId = groupMeta.participants.map((participant) => participant.id);
      await socket.sendMessage(jid, {
        text: `*Perhatian*`,
        mentions: participantsId,
      });
    }

    // .wallet: Get sender's wallet items and calculate the investment return.
    if (messageText === ".wallet") {
      const senderWallet = new WalletController(sender);
      await senderWallet.initializeWallet();

      if (senderWallet?.items?.length > 0) {
        const messageBuilder = new MessageBuilder();
        const { investedCapital, portfolio, portfolioValue, percentChange } = await senderWallet.getPortfolio();
        const percentIndicator = percentChange === 0 ? "" : percentChange > 0 ? "📈" : "📉";

        messageBuilder.append("*Portfolio Anda*", 2);
        portfolio.forEach((item) => {
          const { symbol, itemCount, pricePerItem, currentValue } = item;

          const percentChange = ((currentValue - pricePerItem) / pricePerItem) * 100;
          const percentIndicator = percentChange === 0 ? "" : percentChange > 0 ? "📈" : "📉";

          messageBuilder.append(
            `${itemCount.toLocaleString("id-ID")} ${symbol} - *${toIDR(
              itemCount * currentValue
            )}* (${percentIndicator}${toPercent(percentChange)})`
          );
        });
        messageBuilder.newLine();
        messageBuilder.append(
          `Nilai Investasi : *${toIDR(portfolioValue)}* (${percentIndicator}${toPercent(percentChange)})`
        );
        messageBuilder.append(`Perubahan : *${toIDR(portfolioValue - investedCapital)}*`);
        messageBuilder.append(`Modal Investasi : *${toIDR(investedCapital)}*`, 0);
        await socket.sendMessage(jid, { text: messageBuilder.text }, { quoted: m.messages[0] });
      } else {
        await socket.sendMessage(jid, { text: "Wallet anda kosong" }, { quoted: m.messages[0] });
      }
    }

    if (messageText.startsWith(".add ")) {
      const senderWallet = new WalletController(sender);
      await senderWallet.initializeWallet();

      const [, symbol, amount] = messageText.split(" ");

      if (!symbol || !amount || !amount.includes("@")) {
        return await socket.sendMessage(
          jid,
          { text: "Parameter yang diberikan tidak valid" },
          { quoted: m.messages[0] }
        );
      }
      const itemCount = commaToDecimal(amount.split("@")[0]);
      const pricePerItem = commaToDecimal(amount.split("@")[1]);

      await senderWallet.add(symbol, itemCount, pricePerItem);

      const messageBuilder = new MessageBuilder();
      messageBuilder.append(
        `*${itemCount.toLocaleString("id-ID")} ${symbol.toUpperCase()}* senilai *${toIDR(
          itemCount * pricePerItem
        )}* ditambahkan ke wallet`
      );

      await socket.sendMessage(jid, { text: messageBuilder.text }, { quoted: m.messages[0] });
    }

    if (messageText.startsWith(".remove ")) {
      const symbol = messageText.split(" ")[1].toUpperCase();

      const senderWallet = new WalletController(sender);
      await senderWallet.initializeWallet();

      senderWallet.remove(symbol);

      const messageBuilder = new MessageBuilder();
      messageBuilder.append(`*${symbol.toUpperCase()}* dihapus dari wallet`);

      await socket.sendMessage(jid, { text: messageBuilder.text }, { quoted: m.messages[0] });
    }

    if (messageText.startsWith(".price ")) {
      const symbol = messageText.split(" ")[1].toUpperCase();
      const result = await cryptoCurrencyAPI.find(symbol);
      const data = result.data[symbol];

      if (data.length !== 0) {
        const item = result.data[symbol][0];
        const percentChange = item.quote.IDR.percent_change_24h;
        const percentIndicator = percentChange < 0 ? "📉" : "📈";

        await socket.sendMessage(jid, {
          text: `*${item.name} (${item.symbol})*\n${percentIndicator} ${toPercent(
            percentChange
          )} (24 Jam)\n\n💰 Harga : *${toIDR(item.quote.IDR.price)}*\n📊 Volume (24 Jam) : *${abbreviateNumber(
            item.quote.IDR.volume_24h
          )}*\n📑 Marketcap : *${abbreviateNumber(item.quote.IDR.market_cap)}*\n\n_${dateTime(
            item.quote.IDR.last_updated
          )}_`,
        });
      } else {
        await socket.sendMessage(jid, {
          text: `Tidak ada barang yang bernama ${symbol}`,
        });
      }
    }
  });
};

connectToWhatsApp();
