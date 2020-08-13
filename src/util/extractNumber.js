/**
 * Extract a decimal number from a string. Can be dollar format or percentage with a leading +/- sign
 *
 * @param {String} text - The number in string form to extract the number from
 * @returns {Object} - An Object with the following properties: "number" {Number}, "isDollar" {Boolean}, "isPercent" {Boolean}
 */
function extractNumber(text) {
  let amount = null;
  let isDollar = false;
  let isPercent = false;
  let matches = text.match(/^(\+|-)?(\$)?(\d*\.?\d+)(%|X)?$/i);
  /**
   * Index    Contains            Example
   * 0        The whole match     +$400.00%
   * 1        Plus or Minus       +
   * 2        Dollar Sign         $
   * 3        Number              400.00
   * 4        Percent Sign        %
   */
  if (matches) {
    amount = parseFloat(matches[3]);
    if (matches[1] === "-") {
      amount *= -1;
    }
    if (matches[4] === "%") {
      isPercent = true;
      amount /= 100;
    }
    isDollar = matches[2] === "$";
    amount = Math.floor(amount * 100) / 100;
  }

  return {
    number: amount,
    isDollar: isDollar,
    isPercent: isPercent,
  };
}

export default extractNumber;
