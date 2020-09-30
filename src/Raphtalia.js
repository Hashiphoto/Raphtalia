import Discord from "discord.js";
import dayjs from "dayjs";

import Database from "./db/Database.js";
import secretConfig from "../config/secrets.config.js";
import discordConfig from "../config/discord.config.js";
// TODO: Fix scheduled tasks
// import tasks from "./scheduledTasks.js";
import CommandParser from "./CommandParser.js";
import OnBoarder from "./OnBoarder.js";

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
import NullCommand from "./commands/NullCommand.js";
import BanWord from "./commands/BanWord.js";
import AllowWord from "./commands/AllowWord.js";
import BanList from "./commands/BanList.js";
import CensorController from "./controllers/CensorController.js";
import Censorship from "./commands/Censorship.js";
import ChannelController from "./controllers/ChannelController.js";
import CurrencyController from "./controllers/CurrencyController.js";
import GuildController from "./controllers/GuildController.js";
import MemberController from "./controllers/MemberController.js";
import InventoryController from "./controllers/InventoryController.js";
import Status from "./commands/Status.js";
import Command from "./commands/Command.js";
import Store from "./commands/Store.js";
import Roles from "./commands/Roles.js";
import RoleStatusController from "./controllers/RoleStatusController.js";
import StoreStatusController from "./controllers/StoreStatusController.js";
import Take from "./commands/Take.js";

class Raphtalia {
  constructor() {
    this.client = new Discord.Client();
    this.db = new Database(Database.createPool());

    this.client.once("ready", () => {
      console.log(
        `NODE_ENV: ${process.env.NODE_ENV} | ${dayjs(
          new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
        ).format("MMM D, YYYY - h:mmA")}`
      );
    });

    this.client.login(secretConfig().discord.token).then(() => {
      console.log(`Logged in! Listening for events...`);
    });

    // TODO: Fix scheduled tasks
    // tasks.init(this.client);
  }

  configureDiscordClient() {
    this.client.on("message", (message) => {
      if (message.author.id === this.client.user.id && message.type === "PINS_ADD") {
        return message.delete();
      }

      if (message.author.bot || message.channel.type === "dm" || message.type !== "DEFAULT") {
        return;
      }

      this.attachWatchCommand(message.channel).then((deleteTime) => {
        // Delete the incoming message if the channel is auto-delete enabled
        if (deleteTime >= 0) {
          setTimeout(function () {
            message.delete().catch((error) => {
              if (error.name === "DiscordAPIError" && error.message === "Unknown Message") {
                return; // Message was manually deleted
              }
              throw error;
            });
          }, deleteTime);
        }

        if (message.content.startsWith(CommandParser.prefix)) {
          const parsedMessage = CommandParser.parse(message);
          return this.selectCommand(parsedMessage).then((command) =>
            this.executeCommand(command, parsedMessage)
          );
        } else {
          const censorManager = new CensorController(this.db, message.guild);
          censorManager
            .censorMessage(message)
            .then((censored) => {
              if (censored || message.channel.autoDelete) {
                throw new Error("Cannot payout a censored message");
              }
              return this.db.guilds.get(message.guild.id);
            })
            .then((dbGuild) => {
              return payoutMessage(message, dbGuild);
            })
            .catch((error) => {});
        }
      });
    });

    this.client.on("guildMemberAdd", (member) => {
      const welcomeChannel = this.client.channels.get(discordConfig().channels.welcomeChannelId);
      attachWatchCommand(welcomeChannel).then(() => {
        new OnBoarder(this.db, member.guild).onBoard(member, welcomeChannel);
      });
    });

    this.client.on("guildMemberRemove", (member) => {
      this.db.users.setCitizenship(member.id, member.guild.id, false);
    });

    this.client.on("disconnect", function (event) {
      ``;
      console.log("Bot disconnecting");
      process.exit();
    });
  }

  /**
   * Adds the "watchSend" method to the channel to send messages and delete them
   * after a delay (set in the channel's db entry)
   *
   * @param {Discord.Channel} channel
   */
  attachWatchCommand(channel) {
    return this.db.channels.get(channel.id).then((dbChannel) => {
      let deleteTime = -1;
      if (dbChannel && dbChannel.delete_ms >= 0) {
        deleteTime = dbChannel.delete_ms;
      }
      channel.autoDelete = deleteTime >= 0;
      channel.watchSend = function (...content) {
        return this.send(...content).then((message) => {
          if (deleteTime >= 0) {
            message.delete(deleteTime);
          }
          return message;
        });
      };

      return deleteTime;
    });
  }

  /**
   * @param {Discord.Message} message
   * @returns {Promise<Command>}
   */
  selectCommand(message) {
    let command = Raphtalia.getCommandByName(message.command, message, this.db);
    if (!command) {
      command = new NullCommand(message, `Unknown command "${message.command}"`);
    }
    if (command instanceof NullCommand) {
      return Promise.resolve(command);
    }

    const inventoryController = new InventoryController(this.db, message.guild);
    command.setInventoryController(inventoryController);

    return inventoryController
      .getItemForCommand(message.member, command.constructor.name)
      .then((item) =>
        item
          ? command.setItem(item)
          : new NullCommand(message, `You do not have the correct item to use this command`)
      );
  }

  /**
   * @param {Command} command
   * @param {Discord.Message} message
   */
  executeCommand(command, message) {
    message.channel.startTyping();
    return command
      .execute()
      .catch((error) => {
        console.error(error);
        return message.react("🛑");
      })
      .then(() => message.channel.stopTyping(true))
      .then(() => new StoreStatusController(this.db, message.guild).update());
  }

  /**
   * @param {Discord.Message} message
   * @param {Database} db
   * @returns {Command}
   */
  static getCommandByName(name, message, db) {
    // Keep alphabetical by primary command word
    // The primary command keyword should be listed first
    const guild = message.guild;
    const channel = message.channel;

    switch (name) {
      case "allowword":
      case "allowwords":
        return new AllowWord(message, new CensorController(db, guild));
      case "autodelete":
        return new AutoDelete(message, new ChannelController(db, channel));
      case "balance":
      case "wallet":
        return new Balance(message, new CurrencyController(db, guild));
      case "banlist":
      case "bannedwords":
        return new BanList(message, new CensorController(db, guild));
      case "banword":
      case "banwords":
        return new BanWord(message, new CensorController(db, guild));
      case "buy":
        return new Buy(
          message,
          new CurrencyController(db, guild),
          new StoreStatusController(db, guild)
        );
      case "censorship":
        return new Censorship(message, new GuildController(db, guild));
      case "comfort":
        return new Comfort(message);
      case "delivercheck":
        return new DeliverCheck(message, new CurrencyController(db, guild));
      case "demote":
        return new Demote(message, new MemberController(db, guild));
      case "economy":
        return new Economy(message, new GuildController(db, guild));
      case "exile":
        return new Exile(message, new MemberController(db, guild));
      case "fine":
        return new Fine(
          message,
          new CurrencyController(db, guild),
          new MemberController(db, guild)
        );
      case "give":
        return new Give(
          message,
          new CurrencyController(db, guild),
          new MemberController(db, guild)
        );
      case "help":
        return new Help(message);
      case "holdvote":
        return new HoldVote(message);
      case "income":
        return new Income(
          message,
          new CurrencyController(db, guild),
          new GuildController(db, guild)
        );
      case "infractions":
        return new Infractions(message, new MemberController(db, guild));
      case "kick":
        return new Kick(message, new MemberController(db, guild));
      case "pardon":
        return new Pardon(message, new MemberController(db, guild));
      case "play":
        return new Play(message);
      case "promote":
        return new Promote(message, new MemberController(db, guild));
      case "register":
        return new Register(message, new MemberController(db, guild));
      case "report":
        return new Report(message, new MemberController(db, guild));
      case "roleprice":
        return new RolePrice(
          message,
          new GuildController(db, guild),
          new StoreStatusController((db, guild))
        );
      case "roles":
        return new Roles(message, new RoleStatusController(db, guild));
      case "serverstatus":
        return new ServerStatus(
          message,
          new RoleStatusController(db, guild),
          new StoreStatusController(db, guild)
        );
      case "softkick":
        return new SoftKick(message, new MemberController(db, guild));
      case "status":
        return new Status(message, new CurrencyController(db, guild));
      case "store":
        return new Store(message, new StoreStatusController(db, guild));
      case "take":
        return new Take(
          message,
          new CurrencyController(db, guild),
          new MemberController(db, guild)
        );
      default:
        return new NullCommand(message, `Unknown command "${message.command}"`);
    }
  }
}

export default Raphtalia;
