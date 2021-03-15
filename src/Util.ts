import dayjs, { Dayjs } from "dayjs";

import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export default class Util {
  /**
   * @param {Number} amount
   * @returns {Number}
   */
  public static round(amount: number) {
    return Number(Math.round(Number(amount + "e2")) + "e-2");
  }

  public static formatDate(date: Dayjs) {
    return date.format("h:mm A on MMM D, YYYY");
  }

  /**
   * Generates a number from 0 up to, but not including, max;
   */
  public static random(max: number) {
    return Math.floor(Math.random() * max);
  }

  /**
   * Add a specified amount of time to the current time and return a dayjs date that equals
   * the sum of the current time and the parameter "duration"
   *
   * @param {String} inputText - A string representation of a time span. Ex. "5d 4h 3s" or "30m"
   * @returns {Number} - The duration in milliseconds
   */
  public static parseTime(inputText: string) {
    let matches = inputText.matchAll(/\b(\d+)(d|h|m|s|(?:ms))\b/gi);

    let length = 0;

    let duration = dayjs.duration(0);
    for (const match of matches) {
      length++;
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

    return length ? duration.asMilliseconds() : undefined;
  }

  public static listFormat(itemArray: string[], conjunction = "and") {
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
  }
}
