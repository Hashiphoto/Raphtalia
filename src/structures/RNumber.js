class RNumber {
  amount;
  type;

  static types = {
    DOLLAR: "dollar",
    PERCENT: "percent",
    INT: "int",
    FLOAT: "float",
  };

  parse(text) {
    let amount = null;
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
      return this;
    }
    amount = parseFloat(matches[3]);
    if (matches[1] === "-") {
      amount *= -1;
    }
    if (matches[4] === "%") {
      this.setType(this.types.PERCENT);
    } else if (matches[2] === "$") {
      this.setType(this.types.DOLLAR);
    } else {
      this.setType(this.types.INT);
    }

    // Round to 2 decimal places
    this.amount = Math.floor(amount * 100) / 100;

    return this;
  }

  setType(type) {
    this.type = type;
    if (type === this.types.PERCENT) {
      amount /= 100;
    }
  }

  toString() {
    switch (this.type) {
      case this.types.INT:
        return this.amount.toFixed(0);
      case this.types.DOLLAR:
        return "$" + this.amount.toFixed(2);
      case this.types.PERCENT:
        return this.amount.toFixed(2) + "%";
      default:
        return this.amount.toFixed(0);
    }
  }
}

export default RNumber;
