import Discord, { Guild } from "discord.js";

import Controller from "./Controller.js";
import Database from "../db/Database.js";

export default class GuildBasedController extends Controller {
  public guild: Discord.Guild;

  public constructor(db: Database, guild: Guild) {
    super(db);
    this.guild = guild;
  }
}
