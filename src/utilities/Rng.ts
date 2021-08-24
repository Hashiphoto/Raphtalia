import DiceResult from "../models/DiceResult";
import { random } from "./Util";

export const roll = (dice: Dice): DiceResult => {
  return new DiceResult(random(dice) + 1);
};

export enum Dice {
  D2 = 2,
  D4 = 4,
  D6 = 6,
  D8 = 8,
  D10 = 10,
  D12 = 12,
  D20 = 20,
}
