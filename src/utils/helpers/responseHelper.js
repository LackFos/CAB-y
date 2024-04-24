import * as formatter from "../formatter.js";

// prettier-ignore
export const priceResponse = ({crypto, symbol, percentIndicator, percentChange24H}) => {
  let response = "";
  response += `*${crypto.name} (${symbol})*\n`;
  response += `${percentIndicator} ${formatter.percent(percentChange24H)} (24 Jam)\n`;
  response += `\n`;
  response += `💰 Harga : *${formatter.idr(crypto.quote.IDR.price)}*\n`;
  response += `📊 Volume (24 Jam) : *${formatter.abbreviate(crypto.quote.IDR.volume_24h)}*\n`;
  response += `📑 Marketcap : *${formatter.abbreviate(crypto.quote.IDR.market_cap)}*\n`
  response += `\n`;
  response += `_${formatter.dateTime(crypto.quote.IDR.last_updated)}_`
  return response
};

//  prettier-ignore
export const addItemToWalletResponse = (symbol, pricePerItem, quantity) => {
  let response = "";
  response += `*${quantity.toLocaleString("id-ID")} ${symbol}* senilai *${formatter.idr(quantity * pricePerItem)}* ditambahkan ke wallet`;
  return response;
};

//  prettier-ignore
export const walletSummaryResponse = (wallet) => {
  const {investmentItems, investedCapital, investmentReturn,  percentChange, percentIndicator} = wallet 
  let response = "";

  response += "*Portfolio Anda*\n\n";

  investmentItems.forEach((item) => 
    response += `${item.quantity.toLocaleString("id-ID")} ${item.symbol} - *${formatter.idr(item.quantity * item.currentPrice)}* (${item.percentIndicator}${formatter.percent(item.percentChange)})\n`);
  
  response += '\n'
  response += `Nilai Investasi : *${formatter.idr(investmentReturn)}* (${percentIndicator}${formatter.percent(percentChange)})\n`
  response += `Perubahan : *${formatter.idr(investmentReturn - investedCapital)}*\n`
  response += `Modal Investasi : *${formatter.idr(investedCapital)}*`

  return response
};
