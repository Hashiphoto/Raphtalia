export default class DiceResult {
  public result: number;

  public constructor(result: number) {
    this.result = result;
  }

  public against(dc: number): boolean {
    return this.result >= dc;
  }
}
