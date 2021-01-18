import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";

dayjs.extend(duration);

class Util {
  /**
   * @param {Number} amount
   * @returns {Number}
   */
  static round(amount) {
    return Number(Math.round(amount + "e2") + "e-2");
  }

  /**
   * @param {dayjs.Dayjs} date
   * @returns {String}
   */
  static formatDate(date) {
    return date.format("h:mm A on MMM D, YYYY");
  }

  /**
   * Add a specified amount of time to the current time and return a dayjs date that equals
   * the sum of the current time and the parameter "duration"
   *
   * @param {String} inputText - A string representation of a time span. Ex. "5d 4h 3s" or "30m"
   * @returns {Number} - The duration in milliseconds
   */
  static parseTime(inputText) {
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

    return length ? duration.asMilliseconds() : null;
  }

  static listFormat(itemArray, conjunction = "and") {
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

export default Util;
