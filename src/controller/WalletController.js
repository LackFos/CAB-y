import { promises as fsPromises } from "fs";
import cryptoCurrencyAPI from "../services/cryptoCurrency.js";

class WalletController {
  constructor(user) {
    this.user = user;
    this.db = null;
    this.items = null;
    this.filePath = "./src/wallet.json";
  }

  async initializeWallet() {
    try {
      const fileData = await fsPromises.readFile(this.filePath);
      this.db = JSON.parse(fileData);
      this.items = this.db[this.user] || { items: [] };
    } catch (error) {
      console.error(error);
    }
  }

  async add(symbol, itemCount, pricePerItem) {
    try {
      const itemIndex = this.items.findIndex((item) => item.symbol === symbol);
      const data = this.db;

      if (itemIndex !== -1) {
        data[this.user][itemIndex] = { symbol, itemCount, pricePerItem };
      } else {
        data[this.user].push({ symbol, itemCount, pricePerItem });
      }

      return await fsPromises.writeFile(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to add to wallet:", error);
    }
  }

  async remove(symbol) {
    const data = this.db;
    data[this.user] = this.items.filter((item) => item.symbol !== symbol);
    return await fsPromises.writeFile(this.filePath, JSON.stringify(this.db, null, 2));
  }

  async investmentSummary() {
    const assets = await Promise.all(
      this.items.map(async (item) => {
        const currentPrice = await cryptoCurrencyAPI.getCurrentPrice(item.symbol);
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

    const investedCapital = this.items.reduce((total, item) => total + item.itemCount * item.pricePerItem, 0);
    const investmentReturn = assets.reduce((total, crypto) => total + crypto.itemCount * crypto.currentPrice, 0);
    const percentChange = ((investmentReturn - investedCapital) / investedCapital) * 100;
    const percentIndicator = percentChange === 0 ? "" : percentChange > 0 ? "📈" : "📉";

    return { investedCapital, assets, investmentReturn, percentChange, percentIndicator };
  }
}

export default WalletController;
