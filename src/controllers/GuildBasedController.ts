import Controller from "./Controller.js";
import Discord from "discord.js";
import Database from "../db/Database.js";

class GuildBasedController extends Controller {
  /**
   *
   * @param {Database} db
   * @param {Discord.Guild} guild
   */
  constructor(db, guild) {
    super(db);
    this.guild = guild;
  }
}

export default GuildBasedController;
