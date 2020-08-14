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

class Exile extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      if (this.inputChannel)
        this.inputChannel.watchSend(
          "Please repeat the command and specify who is being exiled"
        );
      return;
    }

    const releaseDate = parseTime(this.message.content);

    this.message.mentionedMembers.forEach((target) => {
      exileMember(target, this.inputChannel, releaseDate);
    });
  }
}

export default Exile;
