export const abbreviate = (number) => {
  if (number < 1000) {
    return number;
  } else if (number < 1000000) {
    return (number / 1000).toFixed(1) + "k";
  } else if (number < 1000000000) {
    return (number / 1000000).toFixed(1) + "m";
  } else if (number < 1000000000000) {
    return (number / 1000000000).toFixed(1) + "b";
    s;
  } else {
    return (number / 1000000000000).toFixed(1) + "t";
  }
};

export const idr = (amount) => {
  if (isNaN(amount)) return "Rp -";

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

export const usd = (amount) => {
  if (isNaN(amount)) return "$ -";

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

export const dateTime = (datetimeStr) => {
  const date = new Date(datetimeStr);
  const localDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  );

  const day = String(localDate.getDate()).padStart(2, "0");
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const year = localDate.getFullYear();
  const hours = String(localDate.getHours()).padStart(2, "0");
  const minutes = String(localDate.getMinutes()).padStart(2, "0");
  const seconds = String(localDate.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const percent = (value) => {
  const absValue = Math.abs(value);
  const decimalPlaces = absValue >= 1 ? 1 : 2;
  return value ? `${value.toFixed(decimalPlaces)}%` : null;
};

export const currency = (value) =>
  parseFloat(value.toString().replaceAll(".", "").replaceAll(",", "."));
