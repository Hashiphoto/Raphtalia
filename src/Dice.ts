import Util from "./Util";

export default class Dice {
  public static Roll(sides: number) {
    return Util.random(sides) + 1;
  }

  public static RollAgainst(sides: number, dc: number) {
    return Dice.Roll(sides) >= dc;
  }
}
