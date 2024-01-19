const formatToIDR = (amount) => {
  if (isNaN(amount)) {
    return "Rp -";
  }

  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: amount >= 1 ? 0 : 8,
  }).format(amount);

  return formattedAmount;
};

export default formatToIDR;
