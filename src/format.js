import dayjs from "dayjs";

class Format {
  static formatDate(date) {
    return date.format("h:mm A on MMM D, YYYY");
  }

  /**
   * Add a specified amount of time to the current time and return a dayjs date that equals
   * the sum of the current time and the parameter "duration"
   *
   * @param {String} duration - A string representation of a time span. Ex. "5d 4h 3s" or "30m"
   * @returns {dayjs} The current time + the duration passed in
   */
  static parseTime(duration) {
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

  static listFormat(itemArray) {
    if (itemArray.length === 1) {
      return itemArray[0];
    }

    if (itemArray.length === 2) {
      return itemArray[0] + " and " + itemArray[1];
    }

    let output = "";
    for (let i = 0; i < itemArray.length; i++) {
      output += itemArray[i];

      // If it's not the last element
      if (i < itemArray.length - 1) {
        output += ", ";
        // If it's the second-to-last element
        if (i === itemArray.length - 2) {
          output += "and ";
        }
      }
    }

    return output;
  }
}

export default Format;
