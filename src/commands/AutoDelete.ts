import { GuildMember, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";
import { parseDuration } from "../utilities/Util";

enum Args {
  ACTION,
  DELAY_MS,
}

@autoInjectable()
export default class AutoDelete extends Command {
  public constructor() {
    super();
    this.instructions =
      "**AutoDelete**\nEnable or disable automatic message deletion in this channel. If deletion delay is not specified, default 2000ms will be used";
    this.usage = "Usage: `AutoDelete (start|stop) [1ms]`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember, args: string[]): Promise<void> {
    if (args.length === 0) {
      await this.sendHelpMessage();
      return;
    }
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    let response: string;
    // AUTO DELETE ON
    if (args[Args.ACTION] === "start") {
      if (args.length < 3) {
        await this.sendHelpMessage(
          "Please use a time format to specify how long to wait before deleting messages in this channel. E.g.: `3s` or `1500ms`"
        );
        return;
      }
      const delayMs = parseDuration(args[Args.DELAY_MS]);
      if (!delayMs) {
        await this.sendHelpMessage(
          "Please use a time format to specify how long to wait before deleting messages in this channel. E.g.: `3s` or `1500ms`"
        );
        return;
      }
      await this.channelService?.setAutoDelete(this.channel.id, delayMs.milliseconds());
      response = `Messages are deleted after ${delayMs}ms`;
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

    await this.channel.setTopic(response);
    await this.reply(response);
    await this.useItem(initiator);
  }
}
