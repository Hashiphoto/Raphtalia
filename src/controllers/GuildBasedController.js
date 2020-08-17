import Controller from "./Controller";

import Controller from "./Controller.js";

class GuildBasedController extends Controller {
  guild;

  constructor(db, guild) {
    super(db);
    this.guild = guild;
  }
}

export default GuildBasedController;
