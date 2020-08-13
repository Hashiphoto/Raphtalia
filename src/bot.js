import Discord from "discord.js";
import dayjs from "dayjs";
import commands from "./commands.js";
import helper from "./helper.js";
import censorship from "./censorship.js";
import db from "./db.js";
import secretConfig from "../config/secrets.config.js";
import discordConfig from "../config/discord.config.js";
import tasks from "./scheduled-tasks.js";
import parseCommand, { prefix } from "./util/parseCommand.js";

const client = new Discord.Client();

// require("log-timestamp")(() => {
// 	return `[${dayjs().format(`MMMD,YY|hh:mm:ssA`)}] %s`;
// });

/**
 * When the client is ready, do this once
 */
client.once("ready", () => {
  console.log(
    `NODE_ENV: ${process.env.NODE_ENV} | ${dayjs(
      new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
    ).format("MMM D, YYYY - h:mA")}`
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
          if (censored || message.channel.autoDelete) return;
          return db.guilds.get(message.guild.id);
        })
        .then((dbGuild) => {
          // TODO: Move to a function for message payout
          if (!dbGuild) return;
          if (message.content.length < dbGuild.min_length) return;

          let amount = Math.min(
            dbGuild.base_payout +
              message.content.length * dbGuild.character_value,
            dbGuild.max_payout
          );

          let sender = message.guild.members.get(message.author.id);

          if (process.env.NODE_ENV === "dev") {
            // message.channel.send(`\`Debug only\` | ${sender} +$${amount.toFixed(2)}`);
          }
          return helper.addCurrency(sender, amount);
        });
    }
  });
});

client.on("guildMemberAdd", (member) => {
  const welcomeChannel = client.channels.get(
    discordConfig().channels.welcomeChannelId
  );
  attachWatchCommand(welcomeChannel).then(() => {
    commands.arrive(welcomeChannel, member);
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

async function processCommand(message) {
  switch (message.command) {
    case "help":
      commands.help(message);
      break;

    case "infractions":
      commands.getInfractions(message);
      break;

    case "kick":
      commands.kick(message, discordConfig().roles.gov);
      break;

    case "infract":
    case "report":
      commands.report(message, discordConfig().roles.gov);
      break;

    case "exile":
      commands.exile(
        message,
        discordConfig().roles.gov,
        helper.parseTime(message.content)
      );
      break;

    case "softkick":
      commands.softkick(message, discordConfig().roles.gov);
      break;

    case "pardon":
      commands.pardon(message, discordConfig().roles.leader);
      break;

    case "promote":
      commands.promote(message, discordConfig().roles.gov);
      break;

    case "demote":
      commands.demote(message, discordConfig().roles.gov);
      break;

    case "comfort":
      commands.comfort(message, discordConfig().roles.leader);
      break;

    // TESTING ONLY
    case "unarrive":
      commands.unarrive(message, discordConfig().roles.gov);
      break;

    case "anthem":
    case "sing":
    case "play":
      commands.play(message, discordConfig().roles.gov);
      break;

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

    case "register":
      commands.registerVoter(message);
      break;

    case "holdvote":
      commands.holdVote(message, discordConfig().roles.leader);
      break;

    // Needs more work for it to be useful
    // case 'whisper':
    //     commands.whisper(responseChannel, sender, message.mentionedMembers, message.content, discordConfig().roles.leader);
    //     break;

    case "wallet":
    case "balance":
    case "cash":
    case "bank":
    case "money":
    case "currency":
      commands.getCurrency(message);
      break;

    case "autodelete":
      commands.setAutoDelete(message, discordConfig().roles.leader);
      break;

    case "give":
      commands.giveCurrency(message);
      break;

    case "fine":
      commands.fine(message, discordConfig().roles.gov);
      break;

    case "economy":
      commands.setEconomy(message, discordConfig().roles.leader);
      break;

    case "income":
      commands.income(message, discordConfig().roles.leader);
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

    case "purchase":
    case "buy":
      commands.buy(message);
      break;

    case "roleprice":
      commands.setRolePrice(message, discordConfig().roles.leader);
      break;

    case "delivercheck":
      commands.createMoney(message, discordConfig().roles.leader);
      break;

    case "serverstatus":
      commands.postServerStatus(message, discordConfig().roles.leader);
      break;

    default:
      if (message.channel) {
        message.channel.watchSend(
          `I think you're confused, Comrade ${message.sender}`
        );
      }
  }
}

export default client;
