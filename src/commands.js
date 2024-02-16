import { evaluate } from "mathjs";
import { toIDR, toUSD } from "./utils/currency.js";
import dateTime from "./utils/datetime.js";
import toPercent from "./utils/toPercent.js";
import commaToDecimal from "./utils/commaToDecimal.js";
import MessageBuilder from "./utils/MessageBuilder.js";
import abbreviateNumber from "./utils/abbreviateNumber.js";
import WalletController from "./controller/WalletController.js";
import cryptoCurrencyAPI from "./services/cryptoCurrency.js";

async function initializeCommands(socket, m) {
  const messageText = m.messages[0].message?.extendedTextMessage?.text ?? m.messages[0].message?.conversation;
  const quotedMessage =
    m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ??
    m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
  const { remoteJid, participant } = m.messages[0].key;

  if (!messageText || remoteJid !== process.env.GROUP_ID) return;
  const groupMeta = await socket.groupMetadata(process.env.GROUP_ID);

  /**
   * Check the bot's connection status.
   * Usage: .ping
   */
  if (messageText === ".ping") {
    return await socket.sendMessage(remoteJid, { text: `*Bot Aktif*` });
  }

  /**
   * Mention all participants in a group chat.
   * Usage: .all
   */
  if (messageText === ".all") {
    const participantsId = groupMeta.participants.map((participant) => participant.id);
    return await socket.sendMessage(remoteJid, { text: "*Perhatian*", mentions: participantsId });
  }

  /**
   * Check the current USDT price.
   * Usage: .usdt <total>
   * Example: .usdt 1
   */
  if (messageText.startsWith(".usdt ")) {
    const validPattern = /\.usdt\s+\d+(\.\d+)?/g;
    const matches = messageText.match(validPattern);

    if (!matches || matches[0] !== messageText || matches.length !== 1) {
      await socket.sendMessage(remoteJid, { text: "Mohon untuk memasukan angka" }, { quoted: m.messages[0] });
      return;
    }

    const USDTAmount = messageText.split(/\s+/g)[1];
    const USDT = await cryptoCurrencyAPI.find("usdt");
    const USDTPrice = USDT.data["USDT"][0].quote.IDR.price;
    const totalPrice = USDTAmount * USDTPrice;
    return await socket.sendMessage(remoteJid, { text: `${toIDR(totalPrice)}` }, { quoted: m.messages[0] });
  }

  /**
   * Check the price of a cryptocurrency.
   * Usage: .price <symbol>
   * Example: .price BTC
   */
  if (messageText.startsWith(".price ")) {
    const symbol = messageText.split(/\s+/g)[1].toUpperCase();
    try {
      const fetch = await cryptoCurrencyAPI.find(symbol);
      const crypto = fetch.data[symbol][0];

      if (crypto?.id) {
        const percentChange24H = crypto.quote.IDR.percent_change_24h;
        const percentIndicator = percentChange24H < 0 ? "📉" : "📈";

        const messageBuilder = new MessageBuilder();
        messageBuilder.append(`*${crypto.name} (${symbol})*`);
        messageBuilder.append(`${percentIndicator} ${toPercent(percentChange24H)} (24 Jam)`);
        messageBuilder.newLine();
        messageBuilder.append(`💰 Harga : *${toIDR(crypto.quote.IDR.price)}*`);
        messageBuilder.append(`📊 Volume (24 Jam) : *${abbreviateNumber(crypto.quote.IDR.volume_24h)}*`);
        messageBuilder.append(`📑 Marketcap : *${abbreviateNumber(crypto.quote.IDR.market_cap)}*`);
        messageBuilder.newLine();
        messageBuilder.append(`_${dateTime(crypto.quote.IDR.last_updated)}_`, 0);
        return await socket.sendMessage(remoteJid, { text: messageBuilder.text });
      }
      return await socket.sendMessage(remoteJid, { text: `Tidak ada crypto yang bernama *${symbol}*` });
    } catch (error) {
      return await socket.sendMessage(remoteJid, {
        text: `Error silahkan coba lagi: ${error.message}`,
      });
    }
  }

  /**
   * Retrieve the user's wallet information and display an investment summary if the wallet is not empty.
   * Usage: .wallet
   */
  if (messageText === ".wallet") {
    try {
      const wallet = new WalletController(participant);
      await wallet.initializeWallet(); // Get user wallet data

      if (wallet.items?.length > 0) {
        const { investedCapital, assets, investmentReturn, percentChange, percentIndicator } =
          await wallet.investmentSummary();

        const messageBuilder = new MessageBuilder();
        messageBuilder.append("*Portfolio Anda*", 2);
        messageBuilder.map(
          assets,
          (asset) =>
            `${asset.itemCount.toLocaleString("id-ID")} ${asset.symbol} - *${toIDR(
              asset.itemCount * asset.currentPrice
            )}* (${asset.percentIndicator}${toPercent(asset.percentChange)})`
        );
        messageBuilder.newLine();
        messageBuilder.append(
          `Nilai Investasi : *${toIDR(investmentReturn)}* (${percentIndicator}${toPercent(percentChange)})`
        );
        messageBuilder.append(`Perubahan : *${toIDR(investmentReturn - investedCapital)}*`);
        messageBuilder.append(`Modal Investasi : *${toIDR(investedCapital)}*`, 0);
        return await socket.sendMessage(remoteJid, { text: messageBuilder.text }, { quoted: m.messages[0] });
      } else {
        return await socket.sendMessage(remoteJid, { text: "Wallet anda kosong" }, { quoted: m.messages[0] });
      }
    } catch (error) {
      return await socket.sendMessage(
        remoteJid,
        { text: `Error silahkan coba lagi: ${error.message}` },
        { quoted: m.messages[0] }
      );
    }
  }

  /**
   * Add an item to the user's wallet.
   * Usage: .add <symbol> <amount>
   * Example: ".add CABY 1@3500" adds 1 units of CABY at the price of 3500 each.
   */
  if (messageText.startsWith(".add ")) {
    const wallet = new WalletController(participant);
    await wallet.initializeWallet();

    const [command, param1, param2] = messageText.split(/\s+/g);
    const symbol = param1.toUpperCase();

    if (!symbol || !param2 || !param2.includes("@"))
      return await socket.sendMessage(
        remoteJid,
        { text: "Parameter yang diberikan tidak valid" },
        { quoted: m.messages[0] }
      );

    try {
      const fetch = await cryptoCurrencyAPI.find(symbol);
      const isCryptoExists = Boolean(fetch.data[symbol].length);

      if (!isCryptoExists)
        return await socket.sendMessage(
          remoteJid,
          { text: `Tidak ada crypto bernama *${symbol}*` },
          { quoted: m.messages[0] }
        );

      const [itemCount, pricePerItem] = param2.split("@").map((item) => commaToDecimal(item));
      await wallet.add(symbol, itemCount, pricePerItem);

      const messageBuilder = new MessageBuilder(
        `*${itemCount.toLocaleString("id-ID")} ${symbol}* senilai *${toIDR(
          itemCount * pricePerItem
        )}* ditambahkan ke wallet`
      );
      await socket.sendMessage(remoteJid, { text: messageBuilder.text }, { quoted: m.messages[0] });
    } catch (error) {
      await socket.sendMessage(
        remoteJid,
        { text: `Terjadi kesalahan, silahkan coba lagi : ${error.message}` },
        { quoted: m.messages[0] }
      );
    }
  }

  /**
   * Remove an item from the user's wallet.
   * Usage: .remove <symbol>
   * Example: ".remove BTC.
   */
  if (messageText.startsWith(".remove ")) {
    const symbol = messageText.split(/\s+/g)[1].toUpperCase();

    const wallet = new WalletController(participant);
    await wallet.initializeWallet();

    const walletItemsCount = wallet.items.length;

    wallet.remove(symbol);

    const messageBuilder = new MessageBuilder();
    walletItemsCount !== wallet.items.length
      ? messageBuilder.append(`*${symbol}* dihapus dari wallet`)
      : messageBuilder.append(`Tidak ada *${symbol}* diwallet`);

    return await socket.sendMessage(remoteJid, { text: messageBuilder.text }, { quoted: m.messages[0] });
  }

  /**
   * Perform a calculation.
   * Usage: .c <expression>
   * Example: .c 2+2
   */
  if (messageText.startsWith(".c ")) {
    const [command, parameters] = messageText.split(/.c./g);
    const normalizeParameters = parameters.replace(/,/g, ".");
    const result = evaluate(normalizeParameters);
    await socket.sendMessage(remoteJid, { text: `${toIDR(result)}` }, { quoted: m.messages[0] });
  }

  if (quotedMessage && quotedMessage.startsWith("Rp")) {
    const previousValue = quotedMessage.replace(/[Rp.]/g, "").trim().replace(/,/g, ".");
    const result = evaluate(`${previousValue} ${messageText.replace(/,/g, ".")}`);
    await socket.sendMessage(remoteJid, { text: `${toIDR(result)}` }, { quoted: m.messages[0] });
  }

  /**
   * Convert a specified amount from IDR (Indonesian Rupiah) to USD (United States Dollar).
   * Usage: .idr <amount>
   * Example: .idr 15600
   */
  if (messageText.startsWith(".idr ")) {
    const validPattern = /\.idr\s+\d+(\.\d+)?/g;
    const matches = messageText.match(validPattern);

    if (!matches || matches[0] !== messageText || matches.length !== 1) {
      await socket.sendMessage(remoteJid, { text: "Mohon untuk memasukan angka" }, { quoted: m.messages[0] });
      return;
    }

    const IDRAmount = messageText.split(/\s+/g)[1];
    const USDT = await cryptoCurrencyAPI.find("usdt");
    const USDTPrice = USDT.data["USDT"][0].quote.IDR.price;
    const USDAmount = IDRAmount / USDTPrice;
    return await socket.sendMessage(remoteJid, { text: `${toUSD(USDAmount)}` }, { quoted: m.messages[0] });
  }
}
export default initializeCommands;
