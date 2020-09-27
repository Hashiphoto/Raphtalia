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

  async setRolePriceMultiplier(multiplier, neutralRole) {
    let discordRoles = this.guild.roles
      .filter((role) => role.hoist && role.calculatedPosition >= neutralRole.calculatedPosition)
      .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
      .array();

    let response = "";

    for (const role of discordRoles) {
      let dbRole = await this.db.roles.getSingle(role.id);
      let newPrice = dbRole.income * multiplier;
      this.db.roles.setRolePrice(role.id, newPrice);
      response += `${role.name} new price: $${newPrice.toFixed(2)}\n`;
    }

    return response;
  }

  removeStatusMessage() {
    return this.db.guilds.get(this.guild.id).then(async (guild) => {
      // Delete the existing status message, if it exists
      if (!guild || !guild.status_message_id) {
        return;
      }

      return this.fetchMessage(guild.status_message_id).then((message) => {
        if (message) {
          return message.delete();
        }
      });
    });
  }

  setStatusMessageId(messageId) {
    return this.db.guilds.setStatusMessage(this.guild.id, messageId);
  }

  removeStoreMessage() {
    return this.db.guilds.get(this.guild.id).then(async (guild) => {
      // Delete the existing status message, if it exists
      if (!guild || !guild.store_message_id) {
        return;
      }

      return this.fetchMessage(guild.store_message_id).then((message) => {
        if (message) {
          return message.delete();
        }
      });
    });
  }

  setStoreMessageId(messageId) {
    return this.db.guilds.setStoreMessage(this.guild.id, messageId);
  }

  async fetchMessage(messageId) {
    let textChannels = this.guild.channels
      .filter((channel) => channel.type === "text" && !channel.deleted)
      .array();

    for (const channel of textChannels) {
      try {
        const message = await channel.fetchMessage(messageId);
        return message;
      } catch (error) {
        console.log(error);
      }
    }
  }
}

export default GuildController;
