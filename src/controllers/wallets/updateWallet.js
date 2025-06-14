import WalletModel from "../../models/walletModel.js";

export const addItemToWallet = async (userId, item) => {
  try {
    const wallet = await WalletModel.findOne({ user: userId });

    if (!wallet) {
      await WalletModel.create({ user: userId, items: [item] });
      return;
    }

    const existingItemIndex = wallet.items.findIndex((walletItem) => walletItem.symbol === item.symbol);

    if (existingItemIndex !== -1) {
      const existingItem = wallet.items[existingItemIndex];
      const updatedQuantity = existingItem.quantity + item.quantity;
      const totalCost = existingItem.pricePerItem * existingItem.quantity + item.pricePerItem * item.quantity;
      const updatedPricePerItem = totalCost / updatedQuantity;

      wallet.items[existingItemIndex] = {
        ...existingItem,
        quantity: updatedQuantity,
        pricePerItem: updatedPricePerItem,
      };
    } else {
      wallet.items.push(item);
    }

    await wallet.save();
  } catch (error) {
    throw new Error(error);
  }
};

export const removeItemFromWallet = async (userId, symbol, quantity) => {
  try {
    const wallet = await WalletModel.findOne({ user: userId, "items.symbol": symbol });

    if (!wallet) {
      throw new Error(`Item with symbol ${symbol} not found in the wallet`);
    }

    const itemToRemove = wallet.items.find((item) => item.symbol === symbol);
    const updatedItems = wallet.items.filter((item) => item.symbol !== symbol);

    if (quantity) {
      itemToRemove.quantity -= quantity;
      updatedItems.push(itemToRemove);
    }

    wallet.items = updatedItems;
    await wallet.save();
  } catch (error) {
    throw error;
  }
};
