import { createSlice } from "@reduxjs/toolkit";
import commaToDecimal from "../utils/commaToDecimal.js";

const walletSlice = createSlice({
  name: "wallet",
  initialState: null,
  reducers: {
    createNewWallet: (state, action) => {
      return action.payload ?? { items: [] };
    },

    addToWallet: (state, action) => {
      const { symbol, itemCount, pricePerItem } = action.payload;
      const walletItems = state?.items || [];
      const itemIndex = walletItems.findIndex((item) => item.symbol === symbol);

      if (itemIndex !== -1) {
        state.items[itemIndex] = { symbol, itemCount, pricePerItem };
      } else {
        state.items.push({ symbol, itemCount: commaToDecimal(itemCount), pricePerItem: commaToDecimal(pricePerItem) });
      }
    },

    removeFromWallet: (state, action) => {
      const symbol = action.payload;
      const updatedWalletItems = state.items.filter((item) => item.symbol !== symbol);
      return { items: updatedWalletItems };
    },
  },
});

export const { createNewWallet, addToWallet, removeFromWallet } = walletSlice.actions;
export default walletSlice.reducer;
