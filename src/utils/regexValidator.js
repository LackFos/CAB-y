export const regexValidator = async (value, regex) => {
  const matches = value.match(regex);

  if (!matches || matches[0] !== value || matches.length !== 1) {
    throw Error("Parameter yang diberikan tidak valid");
  }
};
