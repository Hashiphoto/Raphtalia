import Discord from "discord.js";
import dayjs from "dayjs";

import links from "../resources/links.js";
import db from "./db/Database.js";
import youtube from "./youtube.js";
import censorship from "./controllers/CensorController.js";
import discordConfig from "../config/discord.config.js";
import sendTimedMessage from "./controllers/timedMessage.js";
import { percentFormat, extractNumber } from "./controllers/format.js";
import { clearChannel } from "./controllers/GuildController.js";
import { dateFormat, parseTime } from "./controllers/format.js";
import arrive from "./Onboarder.js";
import { softkickMember } from "./controllers/GuildController.js";
import {
  updateServerStatus,
  generateServerStatus,
} from "./controllers/serverStatus.js";
import {
  addInfractions,
  reportInfractions,
} from "./controllers/MemberController.js";
import {
  addCurrency,
  getUserIncome,
  reportCurrency,
} from "./controllers/CurrencyController.js";
import {
  getNextRole,
  verifyPermission,
  pardonMember,
  exileMember,
  addRoles,
  convertToRole,
  promoteMember,
  demoteMember,
} from "./controllers/RoleController.js";

/**
 * TESTING ONLY - Removes the papers db entry for the target. If no target is given,
 * it deletes the sender's db entry
 */
function unarrive(message, allowedRole) {
  if (!verifyPermission(message.sender, message.channel, allowedRole)) {
    return;
  }

  let target = message.sender;
  if (message.mentionedMembers.length > 0) {
    target = message.mentionedMembers[0];
  }
  return db.users
    .setCitizenship(target.id, member.guild.id, false)
    .then(() => {
      return target.roles.forEach((role) => {
        target.removeRole(role);
      });
    })
    .then(() => {
      if (message.channel)
        return message.channel.watchSend(
          `${target}'s papers have been deleted from record`
        );
    });
}

export default {
  arrive,
  unarrive,
};
