import Discord from "discord.js";
import dayjs from "dayjs";

import Command from "./Command.js";
import links from "../../resources/links.js";
import db from "../db/db.js";
import youtube from "../youtube.js";
import censorship from "../censorship.js";
import discordConfig from "../../config/discord.config.js";
import { percentFormat, extractNumber } from "../util/format.js";
import { clearChannel } from "../util/guildManagement.js";
import { dateFormat, parseTime } from "../util/format.js";
import arrive from "../arrive.js";
import { softkickMember } from "../util/guildManagement.js";
import {
  updateServerStatus,
  generateServerStatus,
} from "../util/serverStatus.js";
import {
  addInfractions,
  reportInfractions,
} from "../util/infractionManagement.js";
import {
  addCurrency,
  getUserIncome,
  reportCurrency,
} from "../util/currencyManagement.js";
import {
  getNextRole,
  verifyPermission,
  pardonMember,
  exileMember,
  addRoles,
  convertToRole,
  promoteMember,
  demoteMember,
} from "../util/roleManagement.js";

class Buy extends Command {
  async execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.message.channel.watchSend(`Usage: !Buy (Item Name)`);
    }
    // Get store items
    switch (this.message.args[0]) {
      case "promotion":
        let nextRole = getNextRole(this.message.sender, this.message.guild);
        if (!nextRole) {
          return this.message.channel.watchSend(
            `You cannot be promoted any higher!`
          );
        }

        let dbRole = await db.roles.getSingle(nextRole.id);
        db.users
          .get(this.message.sender.id, this.message.guild.id)
          .then((dbUser) => {
            if (dbUser.currency < dbRole.price) {
              return this.message.channel.watchSend(
                `You cannot afford a promotion. Promotion to ${
                  nextRole.name
                } costs $${dbRole.price.toFixed(2)}`
              );
            }
            addCurrency(this.message.sender, -dbRole.price);
            promoteMember(this.message.channel, null, this.message.sender);
          });
        break;
      default:
        return this.message.channel.watchSend(`Unknown item`);
    }
  }
}

export default Buy;
