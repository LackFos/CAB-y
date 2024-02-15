const dateTime = (datetimeStr) => {
  console.log(datetimeStr);
  const date = new Date(datetimeStr);
  const localDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

  const day = String(localDate.getDate()).padStart(2, "0");
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const year = localDate.getFullYear();
  const hours = String(localDate.getHours()).padStart(2, "0");
  const minutes = String(localDate.getMinutes()).padStart(2, "0");
  const seconds = String(localDate.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export default dateTime;
