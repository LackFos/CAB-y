import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const apiKey = process.env.API_KEY;

const cryptoCurrency = {
  find: async (symbol) => {
    const fetch = await axios.get("https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest", {
      headers: { "X-CMC_PRO_API_KEY": apiKey },
      params: { symbol, convert: "IDR" },
    });
    return fetch.data;
  },

  top: async () => {
    const fetch = await axios.get("https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest", {
      headers: { "X-CMC_PRO_API_KEY": apiKey },
      params: {
        limit: 5,
        sort: "percent_change_1h",
        market_cap_min: 1000000000,
        convert: "IDR",
      },
    });
    return fetch.data;
  },

  getCurrentPrice: async (symbol) => {
    const fetch = await axios.get("https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest", {
      headers: { "X-CMC_PRO_API_KEY": apiKey },
      params: { symbol, convert: "IDR" },
    });

    return fetch.data.data[symbol][0].quote.IDR.price;
  },
};

export default cryptoCurrency;
