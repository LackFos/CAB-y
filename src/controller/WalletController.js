import { promises as fsPromises } from "fs";
import store from "../store/index.js";
import { createNewWallet, addToWallet, removeFromWallet } from "../store/walletSlice.js";
import cryptoCurrencyAPI from "../api/cryptoCurrency.js";

class WalletController {
  constructor(sender) {
    this.sender = sender;
  }

  async initializeWallet() {
    try {
      const filePath = "./src/database/wallet.json";
      const fileData = await fsPromises.readFile(filePath);
      const data = JSON.parse(fileData);
      const userWallet = data[this.sender] || { items: [] };
      store.dispatch(createNewWallet(userWallet));
    } catch (error) {
      console.error("Failed to initialize wallet:", error);
    }
  }

  async add(symbol, itemCount, pricePerItem) {
    try {
      store.dispatch(
        addToWallet({
          symbol: symbol.toUpperCase(),
          itemCount,
          pricePerItem,
        })
      );
      this.store();
    } catch (error) {
      console.error("Failed to add to wallet:", error);
    }
  }

  async remove(symbol) {
    try {
      store.dispatch(removeFromWallet(symbol));
      this.store();
    } catch (error) {
      console.error("Failed to remove from wallet:", error);
    }
  }

  async store() {
    try {
      const senderWallet = store.getState().wallet;
      const filePath = "./src/database/wallet.json";
      const fileData = await fsPromises.readFile(filePath);
      const data = JSON.parse(fileData);
      data[this.sender] = senderWallet;
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to store wallet data:", error);
    }
  }

  get items() {
    const senderWallet = store.getState().wallet;
    return senderWallet?.items || [];
  }

  async getPortfolio() {
    try {
      const senderWallet = store.getState().wallet;
      const walletItems = senderWallet?.items || [];

      const investedCapital = walletItems.reduce((total, item) => {
        return total + item.itemCount * item.pricePerItem;
      }, 0);

      const getPortfolioData = walletItems.map(async (item) => {
        const currentValue = await cryptoCurrencyAPI.getCurrentPrice(item.symbol);
        return {
          ...item,
          currentValue,
        };
      });

      const portfolio = await Promise.all(getPortfolioData);
      const portfolioValue = portfolio.reduce((total, item) => {
        return total + item.itemCount * item.currentValue;
      }, 0);

      const percentChange = ((portfolioValue - investedCapital) / investedCapital) * 100;

      return { investedCapital, portfolio, portfolioValue, percentChange };
    } catch (error) {
      console.error("Failed to calculate portfolio:", error);
      return { investedCapital: 0, portfolio: [], portfolioValue: 0, percentChange: 0 };
    }
  }
}

export default WalletController;
