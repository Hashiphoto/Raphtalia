import Controller from "./Controller.js";

class GuildBasedController extends Controller {
  constructor(db, guild) {
    super(db);
    this.guild = guild;
  }
}

export default GuildBasedController;
