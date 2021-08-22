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

enum DurMatches {
  NumValue = 1,
  NumType = 2,
}

/**
 * Add a specified amount of time to the current time and return a dayjs date that equals
 * the sum of the current time and the parameter "duration"
 *
 * @param {String} inputText - A string representation of a time span. Ex. "5d 4h 3s" or "30m"
 * @returns {Number} - The duration in milliseconds
 */
const parseDuration = (inputText: string): Duration | undefined => {
  const matches = inputText.matchAll(/\b(\d+)(d|h|m|s|(?:ms))\b/gi);

  let duration = dayjs.duration(0);
  for (const match of matches) {
    const timeSpan = parseInt(match[DurMatches.NumValue]);
    const timeType = match[DurMatches.NumType];

    // For some reason, specifying "ms" breaks dayjs
    if (timeType === "ms") {
      duration = duration.add(timeSpan);
      continue;
    }
    duration = duration.add(timeSpan, timeType);
  }

  return duration.milliseconds() === 0 ? undefined : duration;
};

const parseNumber = (text: string): number | undefined => {
  let amount = null;
  // Remove mentions and commas
  text = text
    .replace(/<.{2}\d+>/i, "")
    .replace(/,/, "")
    .trim();
  /**
   * Index    Contains            Example
   * 0        The whole match     +$400.00%
   * 1        Plus or Minus       +
   * 2        Dollar Sign         $
   * 3        Number              400.00
   * 4        Percent Sign        %
   */
  const matches = text.match(/^(\+|-)?(\$)?(\d+\.?\d*)(%)?$/i);

  if (!matches) {
    return;
  }
  amount = parseFloat(matches[3]);
  if (!amount) {
    return;
  }
  if (matches[1] === "-") {
    amount *= -1;
  }
  if (matches[4]) {
    if (matches[4] === "%") {
      amount /= 100;
    }
  }
  // Round to 2 decimal places
  return round(amount);
};

const listFormat = (itemArray: string[], conjunction = "and"): string => {
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

export enum Format {
  Integer,
  Dollar,
  Percent,
}

const print = (amount: number, format: Format): string => {
  switch (format) {
    case Format.Integer:
      return amount.toFixed(0);
    case Format.Dollar:
      return (
        "$" +
        amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );
    case Format.Percent:
      return (amount * 100).toFixed(2) + "%";
  }
};

export { round, formatDate, random, parseDuration, parseNumber, listFormat, sumString, print };
