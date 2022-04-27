import Weapon from "./Weapon";

export default class Fighter {
  public id: number;
  public userId: string;
  public guildId: string;
  public weapon1: Weapon | undefined;
  public weapon2: Weapon | undefined;
  public currentHealth: number;
  public maxHealth: number;

  public constructor(
    id: number,
    userId: string,
    guildId: string,
    weapon1: string | undefined,
    weapon2: string | undefined,
    currentHealth: number,
    maxHealth: number
  ) {
    this.id = id;
    this.userId = userId;
    this.guildId = guildId;
    this.weapon1 = weapon1 ? new Weapon(weapon1) : undefined;
    this.weapon2 = weapon2 ? new Weapon(weapon2) : undefined;
    this.currentHealth = currentHealth;
    this.maxHealth = maxHealth;
  }

  public toString() {
    return "```json\n" + JSON.stringify(this, undefined, 2) + "\n```";
  }
}
