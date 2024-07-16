import { evaluate, log } from "mathjs";
import WhatsappMessage from "../utils/WhatsappMessage.js";
import * as formatter from "../utils/formatter.js";
import { regexValidator } from "../utils/regexValidator.js";
import { priceResponse, addItemToWalletResponse, walletSummaryResponse } from "../utils/helpers/responseHelper.js";
import { addItemToWallet, removeItemFromWallet } from "../controllers/wallets/updateWallet.js";
import { getCrypto, getUsdtPrice, getCreditInfo } from "../services/coinmarketcap/getCrypto.js";
import { getWalletSummary } from "../controllers/wallets/getWallet.js";
import { getGroup } from "../controllers/groups/getGroup.js";
import { initializeAdminCommand } from "./admin.js";

async function commandHandler(socket, m) {
  const message = new WhatsappMessage(m.messages[0]);

  const group = await getGroup(message.remoteJid); // return null if group not registered
  const isUserBanned = group?.bannedUsers.includes(message.sender);
  const isUserMuted = group?.mutedUsers.includes(message.sender);
  const isAdmin = group?.admins.includes(message.sender);

  if (isUserMuted) await socket.sendMessage(message.remoteJid, { delete: message.ref.key }); // prettier-ignore
  if (!group?.id || isUserBanned || isUserMuted) return;

  try {
    /**
     * Check the bot's connection status.
     * Usage: .ping
     */
    if (message.text === ".ping") {
      return await socket.sendMessage(message.remoteJid, {
        text: `*Bot Aktif*`,
      });
    }

    /**
     * Mention all participants in a group chat.
     * Usage: .all
     */
    if (message.text === ".all") {
      const groupMeta = await socket.groupMetadata(message.remoteJid);

      const participantsId = groupMeta.participants.map((participant) => participant.id);

      return await socket.sendMessage(message.remoteJid, {
        text: "*Perhatian*",
        mentions: participantsId,
      });
    }

    /**
     * Check the price of a cryptocurrency.
     * Usage: .price <symbol>
     * Example: .price BTC
     */
    if (message.text.startsWith(".price ")) {
      const symbol = message.text.split(/\s+/g)[1].toUpperCase();

      const crypto = await getCrypto(symbol);

      if (!crypto) throw Error(`Tidak ada crypto yang bernama *${symbol}*`);

      const percentChange24H = crypto.quote.IDR.percent_change_24h;
      const percentIndicator = percentChange24H < 0 ? "📉" : "📈";

      const response = priceResponse({
        crypto,
        symbol,
        percentIndicator,
        percentChange24H,
      });

      return await socket.sendMessage(message.remoteJid, {
        text: response,
      });
    }

    if (message.text === ".wallet") {
      const wallet = await getWalletSummary(message.sender);

      const { key } = await socket.sendMessage(message.remoteJid, { text: "*Chotto Matte 👉👈*" }, { quoted: message.ref });

      const response = walletSummaryResponse(wallet);

      return await socket.sendMessage(message.remoteJid, {
        text: response,
        edit: key,
      });
    }

    /**
     * Add an item to the user's wallet.
     * Usage: .add <symbol> <amount>
     * Example: ".add CABY 1@3500" adds 1 units of CABY at the price of 3500 each.
     */
    if (message.text.startsWith(".add ")) {
      const commandRegex = /.add\s+[\w\s\S]+\s\d+(\.\d{3})*(,\d+)?@\d+(\.\d{3})*(,\d+)?/g;

      await regexValidator(message.text, commandRegex);

      const [command, param1, param2] = message.text.split(/\s+/g);
      const symbol = param1.toUpperCase();
      const [quantity, pricePerItem] = param2.split("@").map((item) => formatter.currency(item));

      const fetch = await getCrypto(symbol);
      const isCryptoExists = Boolean(fetch.id);

      if (!isCryptoExists) throw Error(`Tidak ada crypto bernama *${symbol}*`);

      addItemToWallet(message.sender, { symbol, pricePerItem, quantity });

      const response = addItemToWalletResponse(symbol, pricePerItem, quantity);

      return await socket.sendMessage(message.remoteJid, { text: response }, { quoted: message.ref });
    }

    /**
     * Remove an item from the user's wallet.
     * Usage: .remove <symbol>
     * Example: ".remove BTC.
     */
    if (message.text.startsWith(".remove ")) {
      const symbol = message.text.split(/\s+/g)[1].toUpperCase();
      const amount = message.text.split(/\s+/g)[2];

      await removeItemFromWallet(message.sender, symbol, amount);

      return await socket.sendMessage(message.remoteJid, { text: `*${symbol}* dihapus dari wallet` }, { quoted: message.ref });
    }

    /**
     * Check a specified amount USDT (United States Dollar) to IDR (Indonesian Rupiah) rate.
     * Usage: .usdt <total>
     * Example: .usdt 1
     */
    if (message.text.startsWith(".usdt ")) {
      const commandRegex = /.usdt\s+\d+(\.\d{3})*(,\d+)?/g;

      await regexValidator(message.text, commandRegex);

      const amount = formatter.currency(message.text.split(/\s+/g)[1]);
      const price = await getUsdtPrice();
      const totalPrice = amount * price;

      return await socket.sendMessage(message.remoteJid, { text: `${formatter.idr(totalPrice)}` }, { quoted: message.ref });
    }

    /**
     * Convert a specified amount from IDR (Indonesian Rupiah) to USDT (United States Dollar).
     * Usage: .idr <amount>
     * Example: .idr 15600
     */
    if (message.text.startsWith(".idr ")) {
      const commandRegex = /.idr\s+\d+(\.\d{3})*(,\d+)?/g;

      await regexValidator(message.text, commandRegex);

      const idrAmount = formatter.currency(message.text.split(/\s+/g)[1]);
      const usdtPrice = await getUsdtPrice();
      const totalUsdt = idrAmount / usdtPrice;

      return await socket.sendMessage(message.remoteJid, { text: `${formatter.usd(totalUsdt)}` }, { quoted: message.ref });
    }

    /**
     * Perform a calculation.
     * Usage: .c <expression>
     * Example: .c 2+2
     */
    if (message.text.startsWith(".c ")) {
      const expression = message.text.replace(/.c\s+/g, "").replaceAll(".", "").replaceAll(",", ".");

      const result = evaluate(expression);

      return await socket.sendMessage(message.remoteJid, { text: formatter.idr(result) }, { quoted: message.ref });
    }

    /**
     * Calculate the difference between two numbers
     * Usage: .percent <interger>-<interger>
     * Example: .percent 5-10
     */
    if (message.text.startsWith(".percent ")) {
      const [command, parameters] = message.text.split(/\s+/g);
      const [oldValue, newValue] = parameters.split("-").map((parameter) => formatter.currency(parameter));

      const result = parseFloat(((newValue - oldValue) / oldValue) * 100);

      return await socket.sendMessage(message.remoteJid, { text: `${formatter.percent(result)}` }, { quoted: message.ref });
    }

    /**
     * Get Coinmarketcap API Credit left
     * Usage: .credit
     */
    if (message.text === ".credit") {
      const fetch = await getCreditInfo();

      return await socket.sendMessage(message.remoteJid, { text: JSON.stringify(fetch.data.usage, undefined, 2) }, { quoted: message.ref });
    }

    isAdmin && initializeAdminCommand(socket, message);
  } catch (error) {
    return await socket.sendMessage(message.remoteJid, { text: `Error: ${error.message}` }, { quoted: message.ref });
  }
}

export default commandHandler;
