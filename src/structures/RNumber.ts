import Util from "../Util.js";

class RNumber {
  amount;
  type;

  static types = {
    DOLLAR: "dollar",
    PERCENT: "percent",
    INT: "int",
    FLOAT: "float",
    MULTIPLIER: "multiplier",
  };

  constructor(amount, type) {
    this.amount = amount;
    this.type = type;
  }

  static parse(text) {
    let amount = null;
    let type = RNumber.types.FLOAT;
    // Remove mentions
    text = text.replace(/<.{2}\d+>/i, "").trim();
    // Get the first number in the text
    let matches = text.match(/^(\+|-)?(\$)?(\d*\.?\d+)(%|X)?$/i);
    /**
     * Index    Contains            Example
     * 0        The whole match     +$400.00%
     * 1        Plus or Minus       +
     * 2        Dollar Sign         $
     * 3        Number              400.00
     * 4        Percent Sign        %
     */
    if (!matches) {
      return null;
    }
    amount = parseFloat(matches[3]);
    if (!amount) {
      return null;
    }
    if (matches[1] === "-") {
      amount *= -1;
    }
    if (matches[4]) {
      if (matches[4] === "%") {
        type = RNumber.types.PERCENT;
        amount /= 100;
      } else if (matches[4].toLowerCase() === "x") {
        type = RNumber.types.MULTIPLIER;
      }
    } else if (matches[2] === "$") {
      type = RNumber.types.DOLLAR;
    }

    // Round to 2 decimal places
    amount = Util.round(amount);

    return new RNumber(amount, type);
  }

  toString() {
    switch (this.type) {
      case RNumber.types.INT:
        return RNumber.formatInt(this.amount);
      case RNumber.types.DOLLAR:
        return RNumber.formatDollar(this.amount);
      case RNumber.types.PERCENT:
        return RNumber.formatPercent(this.amount);
      case RNumber.types.MULTIPLIER:
        return RNumber.formatMultiplier(this.amount);
      default:
        return this.amount.toFixed(0);
    }
  }

  /**
   * @param {Number} amount
   */
  static formatInt(amount) {
    return amount.toFixed(0);
  }

  /**
   * @param {Number} amount
   */
  static formatDollar(amount) {
    return (
      "$" + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  /**
   * @param {Number} amount
   */
  static formatPercent(amount) {
    return (amount * 100).toFixed(2) + "%";
  }

  /**
   * @param {Number} amount
   */
  static formatMultiplier(amount) {
    return amount.toFixed(2) + "x";
  }
}

export default RNumber;
