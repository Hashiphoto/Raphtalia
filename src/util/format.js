import dayjs from "dayjs";

export const dateFormat = "h:mm A on MMM D, YYYY";

/**
 * Add a specified amount of time to the current time and return a dayjs date that equals
 * the sum of the current time and the parameter "duration"
 *
 * @param {String} duration - A string representation of a time span. Ex. "5d 4h 3s" or "30m"
 * @returns {dayjs} The current time + the duration passed in
 */
export function parseTime(duration) {
  let matches = duration.match(/\d+[dhms]/g);
  if (!matches) {
    return null;
  }
  let timePairs = [];
  let endDate = dayjs();
  matches.forEach((m) => {
    // Get the last character as the type (h, m, d, s)
    let timeType = m.slice(-1);
    // The length is every character before the type
    let timeLength = m.slice(0, -1);
    timePairs.push({ type: timeType, length: timeLength });
  });
  timePairs.forEach((pair) => {
    endDate = endDate.add(pair.length, pair.type);
  });

  return endDate;
}

export function percentFormat(number) {
  if (isNaN(number)) {
    number = 0;
  }
  return (number * 100).toFixed(2);
}

/**
 * Extract a decimal number from a string. Can be dollar format or percentage with a leading +/- sign
 *
 * @param {String} text - The number in string form to extract the number from
 * @returns {Object} - An Object with the following properties: "number" {Number}, "isDollar" {Boolean}, "isPercent" {Boolean}
 */
export function extractNumber(text) {
  let amount = null;
  let isDollar = false;
  let isPercent = false;
  let matches = text.match(/^(\+|-)?(\$)?(\d*\.?\d+)(%|X)?$/i);
  /**
   * Index    Contains            Example
   * 0        The whole match     +$400.00%
   * 1        Plus or Minus       +
   * 2        Dollar Sign         $
   * 3        Number              400.00
   * 4        Percent Sign        %
   */
  if (matches) {
    amount = parseFloat(matches[3]);
    if (matches[1] === "-") {
      amount *= -1;
    }
    if (matches[4] === "%") {
      isPercent = true;
      amount /= 100;
    }
    isDollar = matches[2] === "$";
    amount = Math.floor(amount * 100) / 100;
  }

  return {
    number: amount,
    isDollar: isDollar,
    isPercent: isPercent,
  };
}
