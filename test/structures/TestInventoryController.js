import UserItem from "../../src/structures/UserItem.js";
import Discord from "discord.js";

class TestInventoryController {
  /**
   * @param {UserItem} item
   * @param {Discord.GuildMember} member
   */
  useItem(item, member) {
    return Promise.resolve();
  }
}

export default TestInventoryController;
