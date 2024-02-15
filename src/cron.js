import cron from "node-cron";
import MessageBuilder from "./utils/MessageBuilder.js";

function initializeCrons() {
  // Send participant investment summarize every 2 hours
  cron.schedule("0 */2 * * *", async () => {
    const filePath = "./src/wallet.json";
    const fileData = await fsPromises.readFile(filePath);
    const users = JSON.parse(fileData);

    const currentDate = new Date();
    await socket.sendMessage(process.env.PORTO_GROUP_ID, { text: dateTime(currentDate) });

    for (let user in users) {
      const userPhoneNumber = user.split("@")[0];
      const userWallet = new WalletController(user);
      await userWallet.initializeWallet();

      if (userWallet.items?.length <= 0) {
        continue;
      }

      const { investedCapital, assets, investmentReturn, percentChange, percentIndicator } =
        await wallet.investmentSummary();

      const messageBuilder = new MessageBuilder();
      messageBuilder.append(`*Portfolio @${userPhoneNumber}*`, 2);
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
      await socket.sendMessage(process.env.PORTO_GROUP_ID, { text: messageBuilder.text, mentions: [user] });
    }
  });
}

export default initializeCrons;
