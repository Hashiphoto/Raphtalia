import Discord from "discord.js";
import links from "../../resources/links.js";
import GuildBasedController from "./GuildBasedController.js";
import RNumber from "../structures/RNumber.js";

class GuildController extends GuildBasedController {
  // TODO: Move to a ChannelController class?
  static async clearChannel(channel) {
    let pinnedMessages = await channel.fetchPinnedMessages();
    let fetched;
    do {
      fetched = await channel.fetchMessages({ limit: 100 });
      await channel.bulkDelete(fetched.filter((message) => !message.pinned));
    } while (fetched.size > pinnedMessages.size);
  }

  getLeaderRole(guild) {
    return guild.roles
      .filter((role) => role.hoist && role.members.size > 0)
      .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
      .first();
  }

  setCensorship(enable) {
    return this.db.guilds.setCensorship(this.guild.id, enable);
  }

  setMinLength(amount) {
    return this.db.guilds.setMinLength(this.guild.id, amount);
  }

  setCharacterValue(amount) {
    return this.db.guilds.setCharacterValue(this.guild.id, amount);
  }

  setMaxPayout(amount) {
    return this.db.guilds.setMaxPayout(this.guild.id, amount);
  }

  setBasePayout(amount) {
    return this.db.guilds.setBasePayout(this.guild.id, amount);
  }

  setTaxRate(amount) {
    return this.db.guilds.setTaxRate(this.guild.id, amount);
  }

  setBaseIncome(amount) {
    return this.db.guilds.setBaseIncome(this.guild.id, amount);
  }

  async setIncomeScale(baseIncome, roles, scale) {
    let nextIncome = baseIncome;
    let results = [];
    for (let i = 0; i < roles.length; i++) {
      await this.db.roles.setRoleIncome(roles[i].id, nextIncome);
      results.push(`${roles[i].name} will now earn $${nextIncome.toFixed(2)}\n`);
      if (scale.type === RNumber.types.DOLLAR) {
        nextIncome += scale.amount;
      } else {
        nextIncome = nextIncome * scale.amount;
      }
    }

    // Return the income scale highest to lowest
    let announcement = "";
    results.reverse();
    results.forEach((r) => (announcement += r));
    return announcement;
  }
}

export default GuildController;
