const toPercent = (value) => {
  const absValue = Math.abs(value);
  const decimalPlaces = absValue >= 1 ? 1 : 2;
  return `${value.toFixed(decimalPlaces)}%`;
};

export default toPercent;
