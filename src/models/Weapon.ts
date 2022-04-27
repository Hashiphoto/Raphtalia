import RaphError from "./RaphError";
import { Result } from "../enums/Result";

export default class Weapon {
  public attack: number;
  public defense: number;

  public constructor(jsonString: string) {
    try {
      const bareWeapon = JSON.parse(jsonString) as Weapon;
      this.attack = bareWeapon.attack;
      this.defense = bareWeapon.defense;
    } catch (err) {
      console.error(err);
      throw new RaphError(Result.ProgrammingError, `Failed to parse weapon: ${jsonString}`);
    }
  }
}
