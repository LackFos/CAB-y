import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const apiKey = process.env.API_KEY;

export const getCrypto = async (symbol, priceOnly = false) => {
  try {
    const fetch = await axios.get(
      "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
      {
        headers: { "X-CMC_PRO_API_KEY": apiKey },
        params: { symbol, convert: "IDR" },
      }
    );
    const cryptoData = fetch.data.data[symbol][0];

    return priceOnly ? cryptoData.quote.IDR.price : cryptoData;
  } catch (error) {
    throw Error(error);
  }
};

export const getUsdtPrice = async () => {
  try {
    const fetch = await axios.get(
      "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
      {
        headers: { "X-CMC_PRO_API_KEY": apiKey },
        params: { symbol: "USDT", convert: "IDR" },
      }
    );

    return fetch.data.data["USDT"][0].quote.IDR.price;
  } catch (error) {
    throw Error(error);
  }
};

export const getCreditInfo = async () => {
  try {
    const fetch = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/key/info",
      { headers: { "X-CMC_PRO_API_KEY": apiKey } }
    );
    return fetch.data;
  } catch (error) {
    throw Error(error);
  }
};
