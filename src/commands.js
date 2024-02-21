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
  const { remoteJid, participant } = m.messages[0].key;
  const groupMeta = await socket.groupMetadata(process.env.GROUP_ID);
  const messageText = m.messages[0].message?.extendedTextMessage?.text ?? m.messages[0].message?.conversation;
  const quotedMessage =
    m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ??
    m.messages[0].message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;

  if (!messageText || remoteJid !== process.env.GROUP_ID) return; // If the GROUP_ID is not registered, stop the code

  /**
   * Get all available commands.
   * Usage: .help
   */
  if (messageText === ".help") {
    const message = new MessageBuilder();
    message.append("1. *_ping_*\n- ⚙️ Periksa status koneksi bot.", 2);
    message.append("2. *_all_*\n- 📢 Mention semua peserta dalam obrolan grup.", 2);
    message.append("3. *_usdt_*\n- 💱 Periksa harga USDT atau konversikan jumlah USDT ke IDR.", 2);
    message.append("4. *_idr_*\n- 💵 Konversi jumlah IDR ke USD.", 2);
    message.append("5. *_price_*\n- 💰 Periksa harga sebuah cryptocurrency dan tampilkan informasi tambahan.", 2);
    message.append("6. *_wallet_*\n- 🧳 Dapatkan informasi dompet pengguna dan tampilkan ringkasan investasi.", 2);
    message.append("7. *_add_*\n- ➕ Tambahkan item ke dompet pengguna.", 2);
    message.append("8. *_remove_*\n- ➖ Hapus item dari dompet pengguna.", 2);
    message.append("9. *_c_*\n- 🧮 Lakukan perhitungan.", 2);
    message.append("10. *_percent_*\n- 📊 Hitung perubahan persentase antara dua nilai.");
    return await socket.sendMessage(remoteJid, { text: message.text });
  }

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
    const validPattern = /.usdt\s+\d+(\.\d{3})*(,\d+)?/g;
    const matches = messageText.match(validPattern);

    if (!matches || matches[0] !== messageText || matches.length !== 1)
      return await socket.sendMessage(remoteJid, { text: "Mohon untuk memasukan angka" }, { quoted: m.messages[0] });

    try {
      const usdt = await cryptoCurrencyAPI.find("usdt");
      const usdtAmount = commaToDecimal(messageText.split(/\s+/g)[1]);
      const usdtPrice = usdt.data["USDT"][0].quote.IDR.price;
      const totalPrice = usdtAmount * usdtPrice;
      return await socket.sendMessage(remoteJid, { text: `${toIDR(totalPrice)}` }, { quoted: m.messages[0] });
    } catch (error) {
      return await socket.sendMessage(remoteJid, { text: `Error, silahkan coba lagi : ${error.message}` }, { quoted: m.messages[0] });
    }
  }

  /**
   * Convert a specified amount from IDR (Indonesian Rupiah) to USD (United States Dollar).
   * Usage: .idr <amount>
   * Example: .idr 15600
   */
  if (messageText.startsWith(".idr ")) {
    const validPattern = /.idr\s+\d+(\.\d{3})*(,\d+)?/g;
    const matches = messageText.match(validPattern);

    if (!matches || matches[0] !== messageText || matches.length !== 1)
      return await socket.sendMessage(remoteJid, { text: "Silakan masukkan nominal valid" }, { quoted: m.messages[0] });

    try {
      const USDT = await cryptoCurrencyAPI.find("usdt");
      const idrAmount = commaToDecimal(messageText.split(/\s+/g)[1]);
      const usdtPrice = USDT.data["USDT"][0].quote.IDR.price;
      const totalUSDT = idrAmount / usdtPrice;
      return await socket.sendMessage(remoteJid, { text: `${toUSD(totalUSDT)}` }, { quoted: m.messages[0] });
    } catch (error) {
      return await socket.sendMessage(remoteJid, { text: `Error, silahkan coba lagi : ${error.message}` }, { quoted: m.messages[0] });
    }
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

      if (!crypto) throw Error(`Tidak ada crypto yang bernama *${symbol}*`);

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
    } catch (error) {
      return await socket.sendMessage(remoteJid, { text: `Error : ${error.message}` });
    }
  }

  /**
   * Retrieve the user's wallet information and display an investment summary if the wallet is not empty.
   * Usage: .wallet
   */
  if (messageText === ".wallet") {
    try {
      const wallet = new WalletController(participant);
      await wallet.initializeWallet();

      if (wallet.items?.length === 0) throw Error("Wallet anda kosong");

      const { key } = await socket.sendMessage(remoteJid, { text: "*Chotto Matte 👉👈*" }, { quoted: m.messages[0] });

      const { investedCapital, assets, investmentReturn, percentChange, percentIndicator } = await wallet.investmentSummary();

      const messageBuilder = new MessageBuilder();
      messageBuilder.append("*Portfolio Anda*", 2);
      messageBuilder.map(
        assets,
        (asset) =>
          `${asset.itemCount.toLocaleString("id-ID")} ${asset.symbol} - *${toIDR(asset.itemCount * asset.currentPrice)}* (${asset.percentIndicator}${toPercent(
            asset.percentChange
          )})`
      );
      messageBuilder.newLine();
      messageBuilder.append(`Nilai Investasi : *${toIDR(investmentReturn)}* (${percentIndicator}${toPercent(percentChange)})`);
      messageBuilder.append(`Perubahan : *${toIDR(investmentReturn - investedCapital)}*`);
      messageBuilder.append(`Modal Investasi : *${toIDR(investedCapital)}*`, 0);
      return await socket.sendMessage(remoteJid, { text: messageBuilder.text, edit: key });
    } catch (error) {
      console.log("OK");
      return await socket.sendMessage(remoteJid, { text: `Error : ${error.message}`, quoted: m.messages[0] });
    }
  }

  /**
   * Add an item to the user's wallet.
   * Usage: .add <symbol> <amount>
   * Example: ".add CABY 1@3500" adds 1 units of CABY at the price of 3500 each.
   */
  if (messageText.startsWith(".add ")) {
    const validPattern = /.add\s+[\w\s\S]+\s\d+([.,]\d+)?@\d+([.,]\d+)?/g;
    const matches = messageText.match(validPattern);

    if (!matches || matches[0] !== messageText || matches.length !== 1)
      return await socket.sendMessage(remoteJid, { text: "Silahkan cek kembali parameter anda" }, { quoted: m.messages[0] });

    const wallet = new WalletController(participant);
    await wallet.initializeWallet();

    const [command, param1, param2] = messageText.split(/\s+/g);
    const symbol = param1.toUpperCase();
    const [itemCount, pricePerItem] = param2.split("@").map((item) => commaToDecimal(item));

    try {
      const fetch = await cryptoCurrencyAPI.find(symbol);
      const isCryptoExists = Boolean(fetch.data[symbol].length);
      if (!isCryptoExists) throw Error(`Tidak ada crypto bernama *${symbol}*`);

      await wallet.add(symbol, itemCount, pricePerItem);

      const messageBuilder = new MessageBuilder();
      messageBuilder.append(`*${itemCount.toLocaleString("id-ID")} ${symbol}* senilai *${toIDR(itemCount * pricePerItem)}* ditambahkan ke wallet`);
      return await socket.sendMessage(remoteJid, { text: messageBuilder.text }, { quoted: m.messages[0] });
    } catch (error) {
      return await socket.sendMessage(remoteJid, { text: `Error : ${error.message}` }, { quoted: m.messages[0] });
    }
  }

  /**
   * Remove an item from the user's wallet.
   * Usage: .remove <symbol>
   * Example: ".remove BTC.
   */
  if (messageText.startsWith(".remove ")) {
    const validPattern = /.remove\s+[^ ]+/g;
    const matches = messageText.match(validPattern);

    if (!matches || matches[0] !== messageText || matches.length !== 1)
      return await socket.sendMessage(remoteJid, { text: "Silahkan cek kembali parameter anda" }, { quoted: m.messages[0] });

    const wallet = new WalletController(participant);
    await wallet.initializeWallet();

    const symbol = messageText.split(/\s+/g)[1].toUpperCase();
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
    const expression = messageText.replace(/.c\s+/g, "");
    const normalizeExpression = expression.replaceAll(".", "").replaceAll(",", ".");
    try {
      const result = evaluate(normalizeExpression);
      await socket.sendMessage(remoteJid, { text: `Rp ${result.toLocaleString("id-ID")}` }, { quoted: m.messages[0] });
    } catch (error) {
      await socket.sendMessage(remoteJid, { text: `Parameter yang anda berikan tidak valid : ${error.message}` }, { quoted: m.messages[0] });
    }
  }

  if (quotedMessage && quotedMessage.startsWith("Rp")) {
    const previousValue = quotedMessage.replace(/[Rp.]/g, "");
    const normalizePreviousValue = previousValue.trim().replaceAll(".", "").replaceAll(",", ".");
    const normalizeMessageText = messageText.replaceAll(".", "").replaceAll(",", ".");
    const result = evaluate(`${normalizePreviousValue} ${normalizeMessageText}`);
    await socket.sendMessage(remoteJid, { text: `Rp ${result.toLocaleString("id-ID")}` }, { quoted: m.messages[0] });
  }

  if (messageText.startsWith(".percent ")) {
    const [command, parameters] = messageText.split(/\s+/g);
    const [oldValue, newValue] = parameters.split("-").map((parameter) => commaToDecimal(parameter));
    const result = parseFloat(((newValue - oldValue) / oldValue) * 100);
    await socket.sendMessage(remoteJid, { text: `${toPercent(result)}` }, { quoted: m.messages[0] });
  }
}
export default initializeCommands;
