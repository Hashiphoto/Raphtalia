import Discord from "discord.js";
import dayjs from "dayjs";
import delay from "delay";

import Database from "./db/Database.js";
import secretConfig from "../config/secrets.config.js";
import discordConfig from "../config/discord.config.js";
import CommandParser from "./CommandParser.js";
import OnBoarder from "./OnBoarder.js";
import AutoDelete from "./commands/AutoDelete.js";
import Balance from "./commands/Balance.js";
import Buy from "./commands/Buy.js";
import Headpat from "./commands/Headpat.js";
import DeliverCheck from "./commands/DeliverCheck.js";
import Demote from "./commands/Demote.js";
import Exile from "./commands/Exile.js";
import Fine from "./commands/Fine.js";
import Give from "./commands/Give.js";
import Help from "./commands/Help.js";
import HoldVote from "./commands/HoldVote.js";
import Infractions from "./commands/Infractions.js";
import Kick from "./commands/Kick.js";
import Pardon from "./commands/Pardon.js";
import Play from "./commands/Play.js";
import Promote from "./commands/Promote.js";
import Register from "./commands/Register.js";
import Report from "./commands/Report.js";
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
import RoleStatusController from "./controllers/message/RoleStatusController.js";
import StoreStatusController from "./controllers/message/StoreStatusController.js";
import Take from "./commands/Take.js";
import Screening from "./commands/Screening.js";
import ScheduleWatcher from "./ScheduleWatcher.js";
import Debug from "./commands/Debug.js";
import BanListStatusController from "./controllers/message/BanListStatusController.js";

class Raphtalia {
  /**
   * @param {Database} db
   */
  constructor(db) {
    this.client = new Discord.Client();
    this.db = db;

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

    this.scheduleWatcher = new ScheduleWatcher(this.db, this.client);
    this.scheduleWatcher.start();
  }

  configureDiscordClient() {
    this.client.on("message", (message) => {
      // Delete the "Raphtalia has pinned a message to this channel" message
      if (message.author.id === this.client.user.id && message.type === "PINS_ADD") {
        return message.delete();
      }

      if (message.author.bot || message.channel.type === "dm" || message.type !== "DEFAULT") {
        return;
      }

      this.attachWatchCommand(message.channel).then((deleteTime) => {
        this.delayedDelete(message, deleteTime);

        if (message.content.startsWith(CommandParser.prefix)) {
          return this.handleCommand(message);
        } else {
          return this.censorMessage(message).then((censored) => {
            if (censored) {
              return;
            }
            return this.payoutMessage(message);
          });
        }
      });
    });

    this.client.on("guildMemberAdd", (member) => {
      const welcomeChannel = this.client.channels.get(discordConfig().channels.welcomeChannelId);
      this.attachWatchCommand(welcomeChannel).then(() => {
        new OnBoarder(this.db, member.guild, member, welcomeChannel).onBoard();
      });
    });

    this.client.on("guildMemberRemove", (member) => {
      this.db.users.setCitizenship(member.id, member.guild.id, false);
    });

    this.client.on("disconnect", (event) => {
      console.log("Bot disconnecting");
      process.exit();
    });

    this.client.on("messageReactionAdd", (messageReaction, user) => {
      const message = messageReaction.message;
      // Only pay users for their first reaction to a message
      if (message.reactions.filter((e) => e.users.get(user.id)).size > 1) {
        return;
      }
      this.payoutReaction(message, user);
    });

    this.client.on("messageReactionRemove", (messageReaction, user) => {
      // It's possible that the message wasn't cached. If so, the raw event processor will pass in
      // the message instead
      let message = messageReaction;
      if (messageReaction instanceof Discord.MessageReaction) {
        message = messageReaction.message;
      }
      // Only subtract money for removing the user's only remaining reaction
      if (message.reactions.filter((e) => e.users.get(user.id)).size > 0) {
        return;
      }
      this.payoutReaction(message, user, true);
    });

    /**
     * "raw" has to be used since "messageReactionAdd" only applies to cached messages. This will make sure that all
     * reactions emit an event
     * Copied from https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md
     */
    this.client.on("raw", (packet) => {
      if (!["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(packet.t)) return;
      const channel = this.client.channels.get(packet.d.channel_id);
      if (channel.messages.has(packet.d.message_id)) return;
      channel.fetchMessage(packet.d.message_id).then((message) => {
        const emoji = packet.d.emoji.id
          ? `${packet.d.emoji.name}:${packet.d.emoji.id}`
          : packet.d.emoji.name;
        const reaction = message.reactions.get(emoji);
        if (reaction) {
          reaction.users.set(packet.d.user_id, this.client.users.get(packet.d.user_id));
        } else {
          console.log();
        }
        if (packet.t === "MESSAGE_REACTION_ADD") {
          this.client.emit("messageReactionAdd", reaction, this.client.users.get(packet.d.user_id));
        }
        // If the message reactions weren't cached, pass in the message instead
        if (packet.t === "MESSAGE_REACTION_REMOVE") {
          this.client.emit(
            "messageReactionRemove",
            reaction ?? message,
            this.client.users.get(packet.d.user_id)
          );
        }
      });
    });
  }

  handleCommand(message) {
    const parsedMessage = CommandParser.parse(message);
    return this.selectCommand(parsedMessage).then((command) =>
      this.executeCommand(command, parsedMessage)
    );
  }

  censorMessage(message) {
    const censorManager = new CensorController(this.db, message.guild);
    return censorManager.censorMessage(message);
  }

  payoutMessage(message) {
    const currencyController = new CurrencyController(this.db, message.guild);
    return currencyController.payoutMessage(message);
  }

  /**
   * @param {Discord.Message} message
   * @param {Discord.User} user
   * @param {Boolean} undo
   */
  payoutReaction(message, user, undo = false) {
    if (message.author.id === user.id) {
      return;
    }
    const oneDay = dayjs.duration({ hours: 24 });
    if (new Date() - message.createdAt > oneDay.asMilliseconds()) {
      // Ignore reactions to messages older than 24 hours
      return;
    }

    const member = message.guild.members.get(user.id);
    const currencyController = new CurrencyController(this.db, message.guild);

    return currencyController.payoutReaction(message, member, undo);
  }

  /**
   * Delete a message after the given interval. Nothing happens for negative time intervals
   * @param {Discord.Message} message
   * @param {Number} timeMs
   */
  delayedDelete(message, timeMs) {
    if (timeMs < 0) {
      return;
    }

    return delay(timeMs).then(() => {
      message.delete().catch((error) => {
        if (error.name === "DiscordAPIError" && error.message === "Unknown Message") {
          return; // Message was manually deleted
        }
        throw error;
      });
    });
  }

  /**
   * Adds the "watchSend" method to the channel to send messages and delete them
   * after a delay (set in the channel's db entry)
   *
   * @param {Discord.Channel} channel
   * @returns {Number} Milliseconds before messages in this channel should be deleted
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
    // Check for exile
    const exileRole = message.guild.roles.find((r) => r.name === "Exile");
    if (exileRole && message.member.roles.has(exileRole.id)) {
      return Promise.resolve(new NullCommand(message, `You cannot use commands while in exile`));
    }

    // Get the command
    let command = Raphtalia.getCommandByName(message.command, message, this.db, this.client);
    if (!command) {
      command = new NullCommand(message, `Unknown command "${message.command}"`);
    }
    if (command instanceof NullCommand) {
      return Promise.resolve(command);
    }

    // Check if member has the correct item
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
   * @param {Discord.Client} client
   * @returns {Command}
   */
  static getCommandByName(name, message, db, client) {
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
        return new BanList(message, new BanListStatusController(db, guild));
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
      case "delivercheck":
        return new DeliverCheck(message, new CurrencyController(db, guild));
      case "demote":
        return new Demote(message, new MemberController(db, guild));
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
          new MemberController(db, guild),
          client
        );
      case "headpat":
        return new Headpat(message);
      case "help":
        return new Help(message);
      case "holdvote":
        return new HoldVote(message);
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
      case "roles":
        return new Roles(message, new RoleStatusController(db, guild));
      case "screening":
        return new Screening(message, new GuildController(db, guild));
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
      case "debug":
        if (process.env.NODE_ENV === "dev") {
          return new Debug(message, new MemberController(db, guild));
        }
      default:
        return new NullCommand(message, `Unknown command "${message.command}"`);
    }
  }
}

export default Raphtalia;
