const commaToDecimal = (value) => parseFloat(value.toString().replaceAll(".", "").replaceAll(",", "."));

export default commaToDecimal;
