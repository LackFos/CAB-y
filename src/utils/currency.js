const toIDR = (amount) => {
  if (isNaN(amount)) {
    return "Rp -";
  }

  const absValue = Math.abs(amount);
  const decimalPlaces = absValue >= 1 ? 0 : 8;

  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);

  return formattedAmount;
};

const toUSD = (amount) => {
  if (isNaN(amount)) {
    return "$ -";
  }

  const absValue = Math.abs(amount);
  const decimalPlaces = absValue >= 1 ? 2 : 8;

  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);

  return formattedAmount;
};
export { toIDR, toUSD };
