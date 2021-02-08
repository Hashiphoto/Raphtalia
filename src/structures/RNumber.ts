import Util from "../Util";

enum RNumberType {
  DOLLAR,
  PERCENT,
  INT,
  FLOAT,
  MULTIPLIER,
}

export default class RNumber {
  public amount: number;
  public type: RNumberType;

  public static readonly Types = RNumberType;

  public constructor(amount: number, type: RNumberType) {
    this.amount = amount;
    this.type = type;
  }

  public static parse(text: string) {
    let amount = null;
    let type = RNumber.Types.FLOAT;
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
        type = RNumber.Types.PERCENT;
        amount /= 100;
      } else if (matches[4].toLowerCase() === "x") {
        type = RNumber.Types.MULTIPLIER;
      }
    } else if (matches[2] === "$") {
      type = RNumber.Types.DOLLAR;
    }

    // Round to 2 decimal places
    amount = Util.round(amount);

    return new RNumber(amount, type);
  }

  public static formatInt(amount: number) {
    return amount.toFixed(0);
  }

  public static formatDollar(amount: number) {
    return (
      "$" + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  public static formatPercent(amount: number) {
    return (amount * 100).toFixed(2) + "%";
  }

  public static formatMultiplier(amount: number) {
    return amount.toFixed(2) + "x";
  }

  public toString() {
    switch (this.type) {
      case RNumber.Types.INT:
        return RNumber.formatInt(this.amount);
      case RNumber.Types.DOLLAR:
        return RNumber.formatDollar(this.amount);
      case RNumber.Types.PERCENT:
        return RNumber.formatPercent(this.amount);
      case RNumber.Types.MULTIPLIER:
        return RNumber.formatMultiplier(this.amount);
      default:
        return this.amount.toFixed(0);
    }
  }
}
