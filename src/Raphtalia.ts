import { Client, NewsChannel, TextChannel } from "discord.js";

import AllowWord from "./commands/AllowWord";
import AutoDelete from "./commands/AutoDelete";
import Balance from "./commands/Balance";
import BanList from "./commands/BanList";
import BanWord from "./commands/BanWord";
import Buy from "./commands/Buy";
import Censorship from "./commands/Censorship";
import ChannelHelper from "./ChannelHelper";
import Command from "./commands/Command";
import CommandParser from "./CommandParser";
import Database from "./db/Database";
import Debug from "./commands/Debug";
import DeliverCheck from "./commands/DeliverCheck";
import Demote from "./commands/zDemote";
import ExecutionContext from "./structures/ExecutionContext";
import Exile from "./commands/Exile";
import Fine from "./commands/zFine";
import Give from "./commands/Give";
import Headpat from "./commands/Headpat";
import Help from "./commands/Help";
import HoldVote from "./commands/HoldVote";
import Infractions from "./commands/Infractions";
import JobScheduler from "./JobScheduler";
import Kick from "./commands/zKick";
import NullCommand from "./commands/NullCommand";
import OnBoarder from "./Onboarder";
import Pardon from "./commands/Pardon";
import Play from "./commands/Play";
import Promote from "./commands/Promote";
import Register from "./commands/Register";
import Report from "./commands/Report";
import RoleStatusController from "./controllers/message/RoleStatusController";
import Roles from "./commands/Roles";
import Scan from "./commands/Scan";
import Screening from "./commands/Screening";
import ServerStatus from "./commands/ServerStatus";
import SoftKick from "./commands/zSoftKick";
import Status from "./commands/Status";
import Steal from "./commands/Steal";
import Store from "./commands/Store";
import Take from "./commands/Take";
import dayjs from "dayjs";
import delay from "delay";
import secretConfig from "../config/secrets.config";

class Raphtalia {
  private client: Client;
  private db: Database;
  private jobScheduler: JobScheduler;

  constructor(db: Database) {
    this.db = db;
    this.client = new Client();

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

    this.jobScheduler = new JobScheduler(this.db, this.client);
    this.jobScheduler.start();
  }

  public configureDiscordClient() {
    this.client.on("message", async (message) => {
      // Delete the "Raphtalia has pinned a message to this channel" message
      if (
        this.client.user &&
        this.client.user.id === message.author.id &&
        message.type === "PINS_ADD"
      ) {
        return message.delete();
      }

      if (
        message.author.bot ||
        message.channel.type === "dm" ||
        message.type !== "DEFAULT" ||
        message.channel instanceof NewsChannel ||
        !message.guild
      ) {
        return;
      }

      const deleteTime = await this.getDeleteTime(message.channel);
      const context = new ExecutionContext(this.db, this.client, message.guild)
        .setMessage(message)
        .setChannelHelper(new ChannelHelper(message.channel, deleteTime));

      // Delete the incoming message
      this.delayedDelete(context, deleteTime);

      if (message.content.startsWith(CommandParser.COMMAND_PREFIX)) {
        return this.handleCommand(context);
      } else {
        context.censorController.censorMessage().then((censored) => {
          // No money for censored messages
          if (censored) {
            return;
          }
          return context.currencyController.payoutMessage();
        });
      }
    });

    this.client.on("guildMemberAdd", async (member) => {
      const welcomeChannel = member.guild.systemChannel;
      if (!welcomeChannel) {
        return;
      }
      const deleteTime = await this.getDeleteTime(welcomeChannel);

      const context = new ExecutionContext(this.db, this.client, member.guild).setChannelHelper(
        new ChannelHelper(welcomeChannel, deleteTime)
      );

      new OnBoarder(context, member).onBoard();
    });

    this.client.on("guildMemberRemove", (member) => {
      this.db.users.setCitizenship(member.id, member.guild.id, false);
    });

    this.client.on("guildMemberUpdate", (oldMember, newMember) => {
      // Check if roles changed
      const differentSize = oldMember.roles.cache.size !== newMember.roles.cache.size;
      for (const [id, role] of oldMember.roles.cache) {
        if (differentSize || !newMember.roles.cache.has(id)) {
          const context = new ExecutionContext(this.db, this.client, newMember.guild);
          return new RoleStatusController(context).update();
        }
      }
    });

    this.client.on("sharedDisconnect", (event) => {
      console.log(`Bot disconnecting\n ${event.reason}\n ${event.code}`);
      process.exit();
    });

    this.client.on("messageReactionAdd", (messageReaction, user) => {
      const message = messageReaction.message;
      if (!user || !(message.channel instanceof TextChannel) || !message.guild) {
        return;
      }
      // Only pay users for their first reaction to a message
      if (message.reactions.cache.filter((e) => !!e.users.cache.get(user.id)).size > 1) {
        return;
      }
      const context = new ExecutionContext(this.db, this.client, message.guild)
        .setMessage(message)
        .setChannelHelper(new ChannelHelper(message.channel, -1));
      const guildMember = context.guild.members.cache.get(user.id);
      if (!guildMember) {
        return;
      }
      context.initiator = guildMember;
      this.payoutReaction(context);
    });

    this.client.on("messageReactionRemove", (messageReaction, user) => {
      const message = messageReaction.message;
      if (!user || !(message.channel instanceof TextChannel) || !message.guild) {
        return;
      }
      // Only subtract money for removing the user's only remaining reaction
      if (message.reactions.cache.filter((r) => !!r.users.cache.get(user.id)).size > 0) {
        return;
      }
      const context = new ExecutionContext(this.db, this.client, message.guild)
        .setMessage(messageReaction.message)
        .setChannelHelper(new ChannelHelper(message.channel, -1));
      const guildMember = context.guild.members.cache.get(user.id);
      if (!guildMember) {
        return;
      }
      context.initiator = guildMember;
      this.payoutReaction(context, true);
    });

    /**
     * "raw" has to be used since "messageReactionAdd" only applies to cached messages. This will make sure that all
     * reactions emit an event
     * Derived from https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md
     */
    this.client.on("raw", async (packet) => {
      if (!["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(packet.t)) return;
      const channel = this.client.channels.cache.get(packet.d.channel_id);
      if (
        !channel ||
        !(channel instanceof TextChannel) ||
        channel.messages.cache.has(packet.d.message_id)
      ) {
        return;
      }
      const message = await channel.messages.fetch(packet.d.message_id);
      const emoji = packet.d.emoji.id
        ? `${packet.d.emoji.name}:${packet.d.emoji.id}`
        : packet.d.emoji.name;
      const reaction = message.reactions.cache.get(emoji);
      const user = await this.client.users.cache.get(packet.d.user_id);
      if (!reaction || !user) {
        return;
      }
      reaction.users.cache.set(packet.d.user_id, user);
      if (packet.t === "MESSAGE_REACTION_ADD") {
        this.client.emit("messageReactionAdd", reaction, user);
      }
      // If the message reactions weren't cached, pass in the message instead
      else if (packet.t === "MESSAGE_REACTION_REMOVE") {
        this.client.emit("messageReactionRemove", reaction, user);
      }
    });
  }

  private handleCommand(context: ExecutionContext) {
    context.messageHelper = CommandParser.parse(context);
    return this.selectCommand(context).then((command) => this.executeCommand(context, command));
  }

  private payoutReaction(context: ExecutionContext, undo = false) {
    if (context.message.author.id === context.initiator.id) {
      return;
    }
    const expiration = dayjs.duration({ hours: 48 });
    // Ignore reactions to messages older than 48 hours
    if (new Date().getTime() - context.message.createdAt.getTime() > expiration.asMilliseconds()) {
      return;
    }
    context.currencyController.payoutReaction(context.initiator);
  }

  /**
   * Delete a message after the given interval. Nothing happens for negative time intervals
   */
  private async delayedDelete(context: ExecutionContext, timeMs: number) {
    if (timeMs < 0) {
      return;
    }
    await delay(timeMs);
    context.message.delete().catch((error) => {
      // Message was manually deleted
      if (error.name === "DiscordAPIError" && error.message === "Unknown Message") {
        return;
      }
      throw error;
    });
  }

  /**
   * Adds the "watchSend" method to the channel to send messages and delete them
   * after a delay (set in the channel's db entry)
   *
   * @param {Discord.TextChannel} channel
   * @returns {Number} Milliseconds before messages in this channel should be deleted
   */
  getDeleteTime(channel: TextChannel) {
    return this.db.channels.get(channel.id).then((dbChannel) => {
      let deleteTime = -1;
      if (dbChannel && dbChannel.delete_ms >= 0) {
        deleteTime = dbChannel.delete_ms;
      }

      return deleteTime;
    });
  }

  private async selectCommand(context: ExecutionContext): Promise<Command> {
    // Check for exile
    const exileRole = context.guild.roles.cache.find((r) => r.name === "Exile");
    if (exileRole && context.message.member?.roles.cache.find((r) => r.id === exileRole.id)) {
      return Promise.resolve(new NullCommand(context, `You cannot use commands while in exile`));
    }

    // Get the command
    let command = Raphtalia.getCommandByName(context, context.messageHelper.command);
    if (!command) {
      command = new NullCommand(context, `Unknown command "${context.messageHelper.command}"`);
    }
    if (command instanceof NullCommand) {
      return Promise.resolve(command);
    }

    // Check if member has the correct item
    const item = await context.inventoryController.getItemForCommand(
      context.initiator,
      command.constructor.name
    );
    if (item) {
      command.item = item;
      return command;
    }
    return new NullCommand(context, `You do not have the correct item to use this command`);
  }

  private executeCommand(context: ExecutionContext, command: Command) {
    context.message.channel.startTyping();
    return command
      .execute()
      .catch((error) => {
        console.error(error);
        return context.message.react("🛑");
      })
      .then(() => {
        context.message.channel.stopTyping(true);
      });
  }

  /**
   * @param {Discord.Message} message
   * @param {Database} db
   * @param {Discord.Client} client
   * @returns {Command}
   */
  static getCommandByName(context: ExecutionContext, name: string): Command {
    // Keep alphabetical by primary command word
    // The primary command keyword should be listed first
    switch (name) {
      case "allowword":
      case "allowwords":
        return new AllowWord(context);
      case "autodelete":
        return new AutoDelete(context);
      case "balance":
      case "wallet":
        return new Balance(context);
      case "banlist":
      case "bannedwords":
        return new BanList(context);
      case "banword":
      case "banwords":
        return new BanWord(context);
      case "buy":
        return new Buy(context);
      case "censorship":
        return new Censorship(context);
      case "delivercheck":
        return new DeliverCheck(context);
      case "demote":
        return new Demote(context);
      case "exile":
        return new Exile(context);
      case "fine":
        return new Fine(context);
      case "give":
        return new Give(context);
      case "headpat":
        return new Headpat(context);
      case "help":
        return new Help(context);
      case "holdvote":
        return new HoldVote(context);
      case "infractions":
        return new Infractions(context);
      case "kick":
        return new Kick(context);
      case "pardon":
        return new Pardon(context);
      case "play":
        return new Play(context);
      case "promote":
        return new Promote(context);
      case "register":
        return new Register(context);
      case "report":
        return new Report(context);
      case "roles":
        return new Roles(context);
      case "scan":
        return new Scan(context);
      case "screening":
        return new Screening(context);
      case "serverstatus":
        return new ServerStatus(context);
      case "softkick":
        return new SoftKick(context);
      case "status":
        return new Status(context);
      case "steal":
        return new Steal(context);
      case "store":
        return new Store(context);
      case "take":
        return new Take(context);
      case "debug":
        if (process.env.NODE_ENV === "dev") {
          return new Debug(context);
        }
      default:
        return new NullCommand(context, `Unknown command "${name}"`);
    }
  }
}

export default Raphtalia;
