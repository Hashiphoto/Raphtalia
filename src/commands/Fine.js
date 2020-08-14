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

class Fine extends Command {
  execute() {
    if (
      !this.message.mentionedMembers ||
      this.message.mentionedMembers.length === 0
    ) {
      return this.inputChannel.watchSend(
        "Please try again and specify who is being fined"
      );
    }

    let amount = 1;
    this.message.args.forEach((arg) => {
      let temp = extractNumber(arg).number;
      if (temp) {
        amount = temp;
        return;
      }
    });
    addCurrency(
      this.message.sender,
      amount * this.message.mentionedMembers.length
    );
    for (let i = 0; i < this.message.mentionedMembers.length; i++) {
      addCurrency(this.message.mentionedMembers[i], -amount);
    }
    let reply =
      `Fined $${amount.toFixed(2)}` +
      (this.message.mentionedMembers.length > 1 ? ` each!` : `!`);
    this.inputChannel.watchSend(reply);
  }
}

export default Fine;
