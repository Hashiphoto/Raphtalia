export function percentFormat(number) {
  if (isNaN(number)) {
    number = 0;
  }
  return (number * 100).toFixed(2);
}
