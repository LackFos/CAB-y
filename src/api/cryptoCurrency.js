import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.API_KEY;

const cryptoCurrency = {
  find: async (symbol) => {
    const fetch = await axios.get(
      "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
      {
        headers: { "X-CMC_PRO_API_KEY": apiKey },
        params: { symbol, convert: "IDR" },
      }
    );
    return fetch.data;
  },
};

export default cryptoCurrency;
