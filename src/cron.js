import cron from "node-cron";
import { promises as fsPromises } from "fs";
import toIDR from "./utils/toIDR.js";
import dateTime from "./utils/datetime.js";
import toPercent from "./utils/toPercent.js";
import MessageBuilder from "./utils/MessageBuilder.js";
import WalletController from "./controller/WalletController.js";

function initializeCrons(socket) {
  // Send participant investment summarize every 2 hours
  cron.schedule("0 */2 * * *", async () => {
    try {
      const filePath = "./src/wallet.json";
      const fileData = await fsPromises.readFile(filePath);
      const users = JSON.parse(fileData);

      const currentDate = new Date();
      await socket.sendMessage(process.env.PORTO_GROUP_ID, { text: dateTime(currentDate) });

      for (let user in users) {
        const userPhoneNumber = user.split("@")[0];
        const wallet = new WalletController(user);
        await wallet.initializeWallet();

        if (wallet.items?.length <= 0) continue;

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
    } catch (error) {
      console.error(error);
    }
  });
}

export default initializeCrons;
