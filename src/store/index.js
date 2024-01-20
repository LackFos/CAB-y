import { configureStore } from "@reduxjs/toolkit";
import walletReducer from "./walletSlice.js";

const store = configureStore({
  reducer: {
    wallet: walletReducer,
  },
});

export default store;
