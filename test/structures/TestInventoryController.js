import Discord from "discord.js";
import UserItem from "../../src/structures/UserItem";

class TestInventoryController {
  /**
   * @param {UserItem} item
   * @param {Discord.GuildMember} member
   */
  useItem(item, member) {
    return Promise.resolve();
  }

  getUserItem() {
    return Promise.resolve(new UserItem());
  }
}

export default TestInventoryController;
