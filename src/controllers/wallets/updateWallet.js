import WalletModel from "../../models/WalletModel.js";

export const addItemToWallet = async (user, newItem) => {
  try {
    const wallet = await WalletModel.findOne({ user });

    if (wallet) {
      const updatedWalletItems = wallet.items.filter(
        (item) => item.symbol !== newItem.symbol
      );
      updatedWalletItems.push(newItem);

      wallet.items = updatedWalletItems;
      await wallet.save();
    } else {
      await WalletModel.create({ user, items: [newItem] }); // Create new wallet
    }
  } catch (error) {
    throw Error(error);
  }
};

export const removeItemFromWallet = async (user, symbol) => {
  try {
    const wallet = await WalletModel.findOne({ user, "items.symbol": symbol });

    if (!wallet) throw Error(`Tidak ada *${symbol}* dalam wallet`);

    const updatedWalletItems = wallet.items.filter(
      (item) => item.symbol !== symbol
    );

    wallet.items = updatedWalletItems;
    wallet.save();
  } catch (error) {
    throw Error(error);
  }
};
