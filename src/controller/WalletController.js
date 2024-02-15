import { promises as fsPromises } from "fs";
import cryptoCurrencyAPI from "../services/cryptoCurrency.js";

class WalletController {
  constructor(user) {
    this.filePath = "./src/wallet.json";
    this._db = null;
    this.user = user;
    this.items = null;
  }

  async initializeWallet() {
    try {
      const fileData = await fsPromises.readFile(this.filePath);
      this._db = JSON.parse(fileData);

      if (!this._db[this.user]) {
        this._db[this.user] = { items: [] };
        await fsPromises.writeFile(this.filePath, JSON.stringify(this._db, null, 2));
      }

      this.items = this._db[this.user].items;
    } catch (error) {
      console.error(error);
    }
  }

  async add(symbol, itemCount, pricePerItem) {
    try {
      const itemIndex = this.items.findIndex((item) => item.symbol === symbol);

      if (itemIndex !== -1) {
        this._db[this.user].items[itemIndex] = { symbol, itemCount, pricePerItem };
      } else {
        this._db[this.user].items.push({ symbol, itemCount, pricePerItem });
      }
      return await fsPromises.writeFile(this.filePath, JSON.stringify(this._db, null, 2));
    } catch (error) {
      console.error("Failed to add to wallet:", error);
    }
  }

  async remove(symbol) {
    this.items = this.items.filter((item) => item.symbol !== symbol);
    this._db[this.user] = { items: this.items };
    return await fsPromises.writeFile(this.filePath, JSON.stringify(this._db, null, 2));
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
