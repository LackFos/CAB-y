const abbreviateNumber = (number) => {
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

export default abbreviateNumber;
