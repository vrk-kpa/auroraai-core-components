const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export const getAmazonFormattedDate = (): string =>
  `${days[new Date().getUTCDay()]} ${
    months[new Date().getUTCMonth()]
  } ${new Date().getUTCDate()} ${new Date()
    .getUTCHours()
    .toString()
    .padStart(2, "0")}:${new Date()
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}:${new Date()
    .getUTCSeconds()
    .toString()
    .padStart(2, "0")} UTC ${new Date()
    .getUTCFullYear()
    .toString()
    .padStart(4, "0")}`
