import Discord from "discord.js";
import dayjs from "dayjs";

import Command from "./Command.js";
import links from "../../resources/links.js";
import db from "../db/db.js";
import youtube from "../youtube.js";
import censorship from "../censorship.js";
import discordConfig from "../../config/discord.config.js";
import sendTimedMessage from "../util/timedMessage.js";
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

class Give extends Command {
  execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.inputChannel.watchSend(
        "Please try again and specify the amount of money"
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
    if (amount < 0) {
      return addInfractions(
        this.message.sender,
        this.inputChannel,
        1,
        "What are you trying to pull?"
      );
    }
    let totalAmount = amount * this.message.mentionedMembers.length;
    db.users
      .get(this.message.sender.id, this.message.sender.guild.id)
      .then((dbUser) => {
        if (dbUser.currency < totalAmount) {
          return this.inputChannel.watchSend(
            "You don't have enough money for that"
          );
        }
        addCurrency(this.message.sender, -totalAmount);
        this.message.mentionedMembers.forEach((target) => {
          addCurrency(target, amount);
        });
        this.inputChannel.watchSend("Money transferred!");
      });
  }
}

export default Give;
