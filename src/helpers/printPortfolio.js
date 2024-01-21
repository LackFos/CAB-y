import MessageBuilder from "./MessageBuilder.js";
import toIDR from "../utils/toIDR.js";
import toPercent from "../utils/toPercent.js";

const printPortfolio = async (socket, senderWallet) => {
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
        `${itemCount} ${symbol} - *${toIDR(itemCount * currentValue)}* (${percentIndicator}${toPercent(percentChange)})`
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
};

export default printPortfolio;
