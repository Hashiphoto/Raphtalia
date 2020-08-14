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

class AutoDelete extends Command {
  execute() {
    if (!this.message.args || this.message.args.length === 0) {
      if (this.inputChannel)
        this.inputChannel.watchSend(
          "Usage: `AutoDelete (start|stop) [delete delay ms]`"
        );
      return;
    }

    let clearHistory = false;
    let enable = null;
    let deleteDelay = 2000;
    for (let i = 0; i < this.message.args.length; i++) {
      switch (this.message.args[i].toLowerCase()) {
        case "start":
          enable = true;
          break;
        case "stop":
          enable = false;
          break;
        // This is disabled for now because it will not delete messages
        // older than 2 weeks. Deleting 1 at a time can get you banned
        // for "API abuse". See https://github.com/discord/discord-api-docs/issues/208
        // case "clear":
        //   clearHistory = true;
        default:
          let num = parseInt(this.message.args[i]);
          if (isNaN(num)) {
            continue;
          }
          deleteDelay = num;
      }
    }

    if (enable === null) {
      if (this.inputChannel)
        this.inputChannel.watchSend(
          "Usage: `AutoDelete (start|stop) [delete delay ms]`"
        );
      return;
    }

    if (!enable) {
      deleteDelay = -1;
    }

    db.channels.setAutoDelete(this.inputChannel.id, deleteDelay).then(() => {
      if (enable) {
        // clear all msgs
        if (clearHistory) {
          clearChannel(this.inputChannel);
        }

        if (this.inputChannel) {
          this.inputChannel.send(`Messages are deleted after ${deleteDelay}ms`);
        }
      } else {
        if (this.inputChannel) {
          this.inputChannel.send("Messages are no longer deleted");
        }
      }
    });
  }
}

export default AutoDelete;
