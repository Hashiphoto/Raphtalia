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

class Economy extends Command {
  execute() {
    if (!this.message.args || this.message.args.length <= 1) {
      return this.inputChannel.watchSend(
        "Usage: `Economy [MinLength 1] [CharValue $1] [BasePayout $1] [MaxPayout $1] [TaxRate 1%]`"
      );
    }

    for (let i = 0; i < this.message.args.length - 1; i += 2) {
      let amount = extractNumber(this.message.args[i + 1]).number;
      if (amount == null)
        return this.inputChannel.watchSend("Could not understand arguments");

      switch (this.message.args[i].toLowerCase()) {
        case "minlength":
          db.guilds.setMinLength(this.message.guild.id, amount);
          this.inputChannel.watchSend(
            `The minimum length for a this.message to be a paid is now ${amount.toFixed(
              0
            )} characters`
          );
          break;
        case "charvalue":
          db.guilds.setCharacterValue(this.message.guild.id, amount);
          this.inputChannel.watchSend(
            `Messages over the minimum length earn $${amount.toFixed(
              2
            )} per character`
          );
          break;
        case "maxpayout":
          db.guilds.setMaxPayout(this.message.guild.id, amount);
          this.inputChannel.watchSend(
            `The max value earned from a paid this.message is now $${amount.toFixed(
              2
            )}`
          );
          break;
        case "basepayout":
          db.guilds.setBasePayout(this.message.guild.id, amount);
          this.inputChannel.watchSend(
            `Messages over the minimum length earn a base pay of $${amount.toFixed(
              2
            )}`
          );
          break;
        case "taxrate":
          db.guilds.setTaxRate(this.message.guild.id, amount / 100);
          this.inputChannel.watchSend(
            `Members are taxed ${amount.toFixed(
              2
            )}% of their role income on a weekly basis`
          );
          break;
      }
    }
  }
}

export default Economy;
