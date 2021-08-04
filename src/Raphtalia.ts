import { Client, NewsChannel, TextChannel } from "discord.js";

import AllowWord from "./routes/commands/AllowWord";
import AutoDelete from "./routes/commands/AutoDelete";
import Balance from "./routes/commands/Balance";
import BanList from "./routes/commands/BanList";
import BanWord from "./routes/commands/BanWord";
import Buy from "./routes/commands/Buy";
import Censorship from "./routes/commands/Censorship";
import ChannelHelper from "./services/ChannelHelper";
import Command from "./routes/commands/Command";
import CommandParser from "./CommandParser";
import DatabaseService from "./services/Database.service";
import Debug from "./routes/commands/Debug";
import DeliverCheck from "./routes/commands/DeliverCheck";
import Demote from "./routes/commands/zDemote";
import ExecutionContext from "./models/ExecutionContext";
import Exile from "./routes/commands/Exile";
import Fine from "./routes/commands/zFine";
import Give from "./routes/commands/Give";
import Headpat from "./routes/commands/Headpat";
import Help from "./routes/commands/Help";
import HoldVote from "./routes/commands/HoldVote";
import Infractions from "./routes/commands/Infractions";
import JobScheduler from "./JobScheduler";
import Kick from "./routes/commands/zKick";
import NullCommand from "./routes/commands/NullCommand";
import OnBoarder from "./Onboarder";
import Pardon from "./routes/commands/Pardon";
import Play from "./routes/commands/Play";
import Promote from "./routes/commands/Promote";
import Register from "./routes/commands/Register";
import Report from "./routes/commands/Report";
import { Result } from "./enums/Result";
import RoleStatusController from "./services/message/RoleStatusController";
import Roles from "./routes/commands/Roles";
import Scan from "./routes/commands/Scan";
import Screening from "./routes/commands/Screening";
import ServerStatus from "./routes/commands/ServerStatus";
import SoftKick from "./routes/commands/zSoftKick";
import Status from "./routes/commands/Status";
import Steal from "./routes/commands/Steal";
import Store from "./routes/commands/Store";
import Take from "./routes/commands/Take";
import UserItem from "./models/UserItem";
import dayjs from "dayjs";
import delay from "delay";
import secretConfig from "../config/secrets.config";

class Raphtalia {
  private client: Client;
  private db: DatabaseService;
  private jobScheduler: JobScheduler;

  constructor(db: DatabaseService) {
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
        return this.handleCommand(context).then(() =>
          context.currencyController.payoutMessageAuthor()
        );
      } else {
        return context.censorController.censorMessage().then((censored) => {
          // No money for censored messages
          if (censored) {
            return;
          }
          return context.currencyController.payoutMessageAuthor();
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
      return command;
    }

    // Check if member has the correct item
    const userItem = await context.inventoryController.getUserItemByCommand(
      context.initiator,
      command.name
    );
    if (userItem) {
      command.item = userItem;
      return command;
    }

    return this.autoBuyNeededItem(context, command);
  }

  /**
   * Buy the item rquired to execute the given command, and return the command with that
   * item attached
   */
  private async autoBuyNeededItem(context: ExecutionContext, command: Command): Promise<Command> {
    const guildItem = await context.inventoryController.getGuildItemByCommand(
      context.guild.id,
      command.name
    );
    if (!guildItem) {
      return new NullCommand(
        context,
        `There is no item associated with the command "${command.name}"`
      );
    }

    let purchasedUserItem: UserItem | undefined;
    try {
      purchasedUserItem = await context.inventoryController.userPurchase(
        guildItem,
        context.initiator
      );
    } catch (error) {
      let resultMessage = `An error occurred purchasing the ${guildItem.printName()} automatically`;
      switch (error.result) {
        case Result.OutOfStock:
          resultMessage = `Could not auto-purchase ${guildItem.printName()} because it is currently out of stock`;
          break;
        case Result.TooPoor:
          resultMessage = `Could not auto-purchase ${guildItem.printName()} because you're too poor. Current price: ${guildItem.printPrice()}`;
          break;
      }
      return new NullCommand(context, resultMessage);
    }

    if (!purchasedUserItem) {
      return new NullCommand(
        context,
        `Auto-purchasing this item failed. Please try "!Buy ${guildItem.name}"`
      );
    }

    await context.channelHelper.watchSend(
      `*${
        context.initiator.displayName
      } Auto-purchased a ${guildItem.printName()} for ${guildItem.printPrice()}*`
    );

    command.item = purchasedUserItem;
    return command;
  }

  private async executeCommand(context: ExecutionContext, command: Command) {
    context.message.channel.startTyping();
    return command
      .execute()
      .catch((error) => {
        console.error(error);
        return context.message.react("🛑");
      })
      .finally(() => {
        context.message.channel.stopTyping(true);
      });
  }

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
        return new NullCommand(context, `Unknown command "${name}"`);
      default:
        return new NullCommand(context, `Unknown command "${name}"`);
    }
  }
}

export default Raphtalia;
