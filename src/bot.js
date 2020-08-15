import Discord from "discord.js";
import dayjs from "dayjs";

import commands from "./commands.js";
import censorship from "./Censor.js";
import db from "./db/db.js";
import secretConfig from "../config/secrets.config.js";
import discordConfig from "../config/discord.config.js";
import tasks from "./scheduledTasks.js";
import parseCommand, { prefix } from "./util/parseCommand.js";
import { payoutMessage } from "./util/currencyManagement.js";
import Onboarder from "./Onboarder.js";

import AutoDelete from "./commands/AutoDelete.js";
import Balance from "./commands/Balance.js";
import Buy from "./commands/Buy.js";
import Comfort from "./commands/Comfort.js";
import DeliverCheck from "./commands/DeliverCheck.js";
import Demote from "./commands/Demote.js";
import Economy from "./commands/Economy.js";
import Exile from "./commands/Exile.js";
import Fine from "./commands/Fine.js";
import Give from "./commands/Give.js";
import Help from "./commands/Help.js";
import HoldVote from "./commands/HoldVote.js";
import Income from "./commands/Income.js";
import Infractions from "./commands/Infractions.js";
import Kick from "./commands/Kick.js";
import Pardon from "./commands/Pardon.js";
import Play from "./commands/Play.js";
import Promote from "./commands/Promote.js";
import Register from "./commands/Register.js";
import Report from "./commands/Report.js";
import RolePrice from "./commands/RolePrice.js";
import ServerStatus from "./commands/ServerStatus.js";
import SoftKick from "./commands/SoftKick.js";
import UnrecognizedCommand from "./commands/UnrecognizedCommand.js";
import BanWord from "./commands/BanWord.js";
import AllowWord from "./commands/AllowWord.js";

const client = new Discord.Client();

client.once("ready", () => {
  db.init();
  console.log(
    `NODE_ENV: ${process.env.NODE_ENV} | ${dayjs(
      new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    ).format("MMM D, YYYY - h:mmA")}`
  );
});

client.login(secretConfig().discord.token).then(() => {
  console.log(`Logged in! Listening for events...`);
});

tasks.init(client);

client.on("message", (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.channel.type === "dm" || message.type !== "DEFAULT") {
    return;
  }

  attachWatchCommand(message.channel).then((deleteTime) => {
    // Delete the incoming message if the channel is auto-delete enabled
    if (deleteTime >= 0) {
      setTimeout(function () {
        message.delete().catch((error) => {
          console.error("Message was probably already deleted\n" + error);
        });
      }, deleteTime);
    }
    if (message.content.startsWith(prefix)) {
      processCommand(parseCommand(message));
    } else {
      censorship
        .censorMessage(message)
        .then((censored) => {
          if (censored || message.channel.autoDelete) {
            throw new Error("Cannot payout a censored message");
          }
          return db.guilds.get(message.guild.id);
        })
        .then((dbGuild) => {
          return payoutMessage(message, dbGuild);
        })
        .catch((error) => {});
    }
  });
});

client.on("guildMemberAdd", (member) => {
  const welcomeChannel = client.channels.get(
    discordConfig().channels.welcomeChannelId
  );
  attachWatchCommand(welcomeChannel).then(() => {
    new Onboarder().onBoard(member, welcomeChannel);
  });
});

client.on("guildMemberRemove", (member) => {
  db.users.setCitizenship(member.id, member.guild.id, false);
});

client.on("disconnect", function (event) {
  console.log("Bot disconnecting");
  process.exit();
});

/**
 * Adds the "watchSend" method to the channel to send messages and delete them
 * after a delay (set in the channel's db entry)
 *
 * @param {Discord.Channel} channel
 */
function attachWatchCommand(channel) {
  return db.channels.get(channel.id).then((dbChannel) => {
    let deleteTime = -1;
    if (dbChannel && dbChannel.delete_ms >= 0) {
      deleteTime = dbChannel.delete_ms;
    }
    channel.autoDelete = deleteTime >= 0;
    channel.watchSend = function (content) {
      return this.send(content).then((message) => {
        if (deleteTime >= 0) {
          message.delete(deleteTime);
        }
        return message;
      });
    };

    return deleteTime;
  });
}

function processCommand(message) {
  let command = getCommandByName(message);
  if (command.userCanExecute()) {
    command.execute();
  }
}

function getCommandByName(message) {
  // Keep alphabetical by primary command word
  // The primary command keyword should be listed first
  switch (message.command) {
    case "allowword":
    case "allowwords":
      return new AllowWord(message);
    case "autodelete":
      return new AutoDelete(message);
    case "balance":
    case "wallet":
      return new Balance(message);
    case "banword":
    case "banwords":
      return new BanWord(message);
    case "buy":
      return new Buy(message);
    case "comfort":
      return new Comfort(message);
    case "delivercheck":
      return new DeliverCheck(message);
    case "demote":
      return new Demote(message);
    case "economy":
      return new Economy(message);
    case "exile":
      return new Exile(message);
    case "fine":
      return new Fine(message);
    case "give":
      return new Give(message);
    case "help":
      return new Help(message);
    case "holdvote":
      return new HoldVote(message);
    case "income":
      return new Income(message);
    case "infractions":
      return new Infractions(message);
    case "kick":
      return new Kick(message);
    case "pardon":
      return new Pardon(message);
    case "play":
      return new Play(message);
    case "promote":
      return new Promote(message);
    case "register":
      return new Register(message);
    case "report":
      return new Report(message);
    case "roleprice":
      return new RolePrice(message);
    case "serverstatus":
      return new ServerStatus(message);
    case "softkick":
      return new SoftKick(message);

    // TODO: Move these into commands also
    case "banword":
    case "banwords":
    case "bannedwords":
      censorship.banWords(message, discordConfig().roles.gov);
      break;

    case "allowword":
    case "allowwords":
    case "unbanword":
    case "unbanwords":
      censorship.allowWords(message, discordConfig().roles.gov);
      break;

    case "enablecensorship":
      censorship.enable(message, true, discordConfig().roles.leader);
      break;

    case "disablecensorship":
      censorship.enable(message, false, discordConfig().roles.leader);
      break;

    // TODO: Move these into commands
    //// DEV ONLY ////
    case "unarrive":
      if (process.env.NODE_ENV !== "dev") {
        break;
      }
      commands.unarrive(message, discordConfig().roles.gov);
      break;

    case "doincome":
      if (process.env.NODE_ENV !== "dev") {
        break;
      }
      tasks.dailyIncome(message.guild);
      message.channel.send("`Debug only` | Income has been distributed");
      break;

    case "dotaxes":
      if (process.env.NODE_ENV !== "dev") {
        break;
      }
      tasks.tax(message.guild);
      message.channel.send("`Debug only` | Members have been taxed");
      break;
    /////////////////

    default:
      return new UnrecognizedCommand(message);
  }
}

export default client;
