import Discord from "discord.js";
import dayjs from "dayjs";

import commands from "./commands.js";
import censorship from "./CensorManager.js";
import Database from "./db/Database.js";
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
import BanList from "./commands/BanList.js";
import CensorManager from "./CensorManager.js";
import Censorship from "./commands/Censorship.js";

const client = new Discord.Client();
const db = new Database(Database.createPool());

client.once("ready", () => {
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
      const censorManager = new CensorManager();
      censorManager
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
  ``;
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
      return new AllowWord(message, db);
    case "autodelete":
      return new AutoDelete(message, db);
    case "balance":
    case "wallet":
      return new Balance(message, db);
    case "banlist":
    case "bannedwords":
      return new BanList(message, db);
    case "banword":
    case "banwords":
      return new BanWord(message, db);
    case "buy":
      return new Buy(message, db);
    case "censorship":
      return new Censorship(message, db);
    case "comfort":
      return new Comfort(message, db);
    case "delivercheck":
      return new DeliverCheck(message, db);
    case "demote":
      return new Demote(message, db);
    case "economy":
      return new Economy(message, db);
    case "exile":
      return new Exile(message, db);
    case "fine":
      return new Fine(message, db);
    case "give":
      return new Give(message, db);
    case "help":
      return new Help(message, db);
    case "holdvote":
      return new HoldVote(message, db);
    case "income":
      return new Income(message, db);
    case "infractions":
      return new Infractions(message, db);
    case "kick":
      return new Kick(message, db);
    case "pardon":
      return new Pardon(message, db);
    case "play":
      return new Play(message, db);
    case "promote":
      return new Promote(message, db);
    case "register":
      return new Register(message, db);
    case "report":
      return new Report(message, db);
    case "roleprice":
      return new RolePrice(message, db);
    case "serverstatus":
      return new ServerStatus(message, db);
    case "softkick":
      return new SoftKick(message, db);

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
