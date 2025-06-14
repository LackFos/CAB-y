import WalletModel from "../../models/walletModel.js";
import { getCrypto } from "../../services/coinmarketcap/getCrypto.js";

export const getWalletSummary = async (user) => {
  const wallet = await WalletModel.findOne({ user });

  if (!wallet) throw Error("Wallet anda kosong!");

  // prettier-ignore
  const investmentItems = await Promise.all(
    wallet.items.map(async (item) => {
      const currentPrice = await getCrypto(item.symbol, true);
      const percentChange = ((currentPrice - item.pricePerItem) / item.pricePerItem) * 100;
      const percentIndicator = percentChange === 0 ? "" : percentChange > 0 ? "📈" : "📉";

      return {
        ...item,
        currentPrice,
        percentChange,
        percentIndicator,
      };
    })
  );

  const investmentReturn = investmentItems.reduce((total, crypto) => total + crypto.currentPrice * crypto.quantity, 0); // prettier-ignore
  const percentChange = ((investmentReturn - wallet.investedCapital) / wallet.investedCapital) * 100; // prettier-ignore
  const percentIndicator = percentChange === 0 ? "" : percentChange > 0 ? "📈" : "📉"; // prettier-ignore

  return {
    investmentItems,
    investedCapital: wallet.investedCapital,
    investmentReturn,
    percentChange,
    percentIndicator,
  };
};
