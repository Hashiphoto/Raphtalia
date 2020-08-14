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

class DeliverCheck extends Command {
  execute() {
    if (
      this.message.mentionedMembers.length === 0 ||
      !this.message.args ||
      this.message.args.length < 2
    ) {
      return this.inputChannel.watchSend("Usage: `!DeliverCheck @target $1`");
    }

    let amount = extractNumber(this.message.args[this.message.args.length - 1]);
    if (amount.number == null) {
      return this.inputChannel.watchSend("Usage: `!DeliverCheck @target $1`");
    }

    this.message.mentionedMembers.forEach((target) => {
      addCurrency(target, amount.number);
    });
    this.inputChannel.watchSend("Money has been distributed!");
  }
}

export default DeliverCheck;
