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

export default toIDR;
