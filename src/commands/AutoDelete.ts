import { GuildMember, TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";
import { Result } from "../enums/Result";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { parseDuration } from "../utilities/Util";
import Command from "./Command";

enum Args {
  ACTION,
  DELAY_MS,
}

@autoInjectable()
export default class AutoDelete extends Command {
  public constructor() {
    super();
    this.name = "AutoDelete";
    this.instructions =
      "Enable or disable automatic message deletion in this channel. If deletion delay is not specified, default 2000ms will be used";
    this.usage = "`AutoDelete (start|stop) [1ms]`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    if (cmdMessage.args.length === 0) {
      await this.sendHelpMessage();
      return;
    }

    await this.run(cmdMessage.message.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember, args: string[]): Promise<number | undefined> {
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    let response: string;
    // AUTO DELETE ON
    if (args[Args.ACTION] === "start") {
      if (args.length < 2) {
        await this.sendHelpMessage(
          "Please use a time format to specify how long to wait before deleting messages in this channel. E.g.: `3s` or `1500ms`"
        );
        return;
      }
      console.log(args, args[Args.DELAY_MS]);
      const delayMs = parseDuration(args[Args.DELAY_MS]);
      console.log(delayMs);
      if (delayMs === undefined) {
        await this.sendHelpMessage(
          "Please use a time format to specify how long to wait before deleting messages in this channel. E.g.: `3s` or `1500ms`"
        );
        return;
      }
      await this.channelService?.setAutoDelete(this.channel.id, delayMs.asMilliseconds());
      response = `Messages are deleted after ${delayMs.asMilliseconds()}ms`;
    }
    // AUTO DELETE OFF
    else if (args[Args.ACTION] === "stop") {
      await this.channelService?.setAutoDelete(this.channel.id, -1);
      response = "Messages are no longer deleted";
    }
    // ERROR
    else {
      await this.sendHelpMessage();
      return;
    }

    this.channel.setTopic(response);
    this.reply(response);
    return 1;
  }
}
