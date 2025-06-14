import cron from "node-cron";
import { getWalletSummary } from "./controllers/wallets/getWallet.js";
import WalletModel from "./models/walletModel.js";
import { walletSummaryResponse } from "./utils/helpers/responseHelper.js";

const setupCronJob = (socket) => {
  cron.schedule("0 */2 * * *", async () => {
    try {
      const wallets = await WalletModel.find();
      const subcribers = wallets.filter((wallet) => wallet.isSubscriber === true);

      subcribers.forEach(async (wallet) => {
        try {
          const summary = await getWalletSummary(wallet.user);
          const response = walletSummaryResponse(summary);
          await socket.sendMessage(wallet.user, { text: response });
        } catch (error) {
          console.log(error);
        }
      });
    } catch (error) {
      console.log(error);
    }
  });
};

export default setupCronJob;
