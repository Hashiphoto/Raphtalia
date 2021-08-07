import dayjs, { Dayjs } from "dayjs";
import duration, { Duration } from "dayjs/plugin/duration";

dayjs.extend(duration);

/**
 * @param {Number} amount
 * @returns {Number}
 */
const round = (amount: number) => {
  return Number(Math.round(Number(amount + "e2")) + "e-2");
};

const formatDate = (date: Dayjs) => {
  return date.format("h:mm A on MMM D, YYYY");
};

/**
 * Generates a number from 0 up to, but not including, max;
 */
const random = (max: number) => {
  return Math.floor(Math.random() * max);
};

/**
 * Add a specified amount of time to the current time and return a dayjs date that equals
 * the sum of the current time and the parameter "duration"
 *
 * @param {String} inputText - A string representation of a time span. Ex. "5d 4h 3s" or "30m"
 * @returns {Number} - The duration in milliseconds
 */
const parseDuration = (inputText: string): Duration => {
  const matches = inputText.matchAll(/\b(\d+)(d|h|m|s|(?:ms))\b/gi);

  let duration = dayjs.duration(0);
  for (const match of matches) {
    // The duration is in capturing group 1
    const timeSpan = parseInt(match[1]);
    // The type is in capturing group 2
    const timeType = match[2];

    // For some reason, specifying "ms" breaks dayjs?
    if (timeType === "ms") {
      duration = duration.add(timeSpan);
      continue;
    }
    duration = duration.add(timeSpan, timeType);
  }

  return duration;
};

const listFormat = (itemArray: string[], conjunction = "and") => {
  if (itemArray.length === 1) {
    return itemArray[0];
  }

  if (itemArray.length === 2) {
    return itemArray[0] + ` ${conjunction} ` + itemArray[1];
  }

  let output = "";
  for (let i = 0; i < itemArray.length; i++) {
    output += itemArray[i];

    // If it's not the last element
    if (i < itemArray.length - 1) {
      output += ", ";
      // If it's the second-to-last element
      if (i === itemArray.length - 2) {
        output += `${conjunction} `;
      }
    }
  }

  return output;
};

const sumString = (a: string, b: string): string => {
  return a + b;
};

export { round, formatDate, random, parseDuration, listFormat, sumString };
