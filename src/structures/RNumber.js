class RNumber {
  amount;
  type;

  types = {
    DOLLAR: "dollar",
    PERCENT: "percent",
    INT: "int",
    FLOAT: "float",
  };

  parse(text) {
    let amount = null;
    let type = this.types.INT;
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
      type = this.types.PERCENT;
      amount /= 100;
    } else if (matches[2] === "$") {
      type = this.types.DOLLAR;
    }

    amount = Math.floor(amount * 100) / 100;

    this.amount = amount;
    this.type = type;

    return this;
  }
}

export default RNumber;
