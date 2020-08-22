class RNumber {
  amount;
  type;

  static types = {
    DOLLAR: "dollar",
    PERCENT: "percent",
    INT: "int",
    FLOAT: "float",
  };

  constructor(amount, type) {
    this.amount = amount;
    this.type = type;
  }

  static parse(text) {
    let amount = null;
    let type = RNumber.types.INT;
    text = text.replace(/<.{2}\d+>/i, "").trim();
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
    if (matches[1] === "-") {
      amount *= -1;
    }
    if (matches[4] === "%") {
      type = RNumber.types.PERCENT;
    } else if (matches[2] === "$") {
      type = RNumber.types.DOLLAR;
    }

    // Round to 2 decimal places
    amount = Math.floor(amount * 100) / 100;

    return new RNumber(amount, type);
  }

  setType(type) {
    this.type = type;
    if (type === RNumber.types.PERCENT) {
      amount /= 100;
    }
  }

  toString() {
    switch (this.type) {
      case RNumber.types.INT:
        return this.formatInt(this.amount);
      case RNumber.types.DOLLAR:
        return this.formatDollar(this.amount);
      case RNumber.types.PERCENT:
        return this.formatPercent(this.amount);
      default:
        return this.amount.toFixed(0);
    }
  }

  static formatInt(amount) {
    return amount.toFixed(0);
  }

  static formatDollar(amount) {
    return "$" + amount.toFixed(2);
  }

  static formatPercent(amount) {
    return amount.toFixed(2) + "%";
  }
}

export default RNumber;
