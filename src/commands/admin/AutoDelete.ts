import { TextBasedChannel, TextBasedChannels, TextChannel } from "discord.js";

import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import { IArgsProps } from "../../interfaces/CommandInterfaces";
import RaphError from "../../models/RaphError";
import { Result } from "../../enums/Result";
import { autoInjectable } from "tsyringe";
import { parseDuration } from "../../utilities/Util";

enum Args {
  ACTION,
  DELAY_MS,
}

@autoInjectable()
export default class AutoDelete extends Command<IArgsProps> {
  public constructor() {
    super();
    this.name = "AutoDelete";
    this.instructions =
      "Enable or disable automatic message deletion in this channel. If deletion delay is not specified, default 2000ms will be used";
    this.usage = "`AutoDelete (start|stop) [1ms]`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    if (cmdMessage.args.length === 0) {
      await this.sendHelpMessage();
      return;
    }

    await this.runWithItem({ initiator: cmdMessage.message.member, args: cmdMessage.args });
  }

  public async execute(props: IArgsProps): Promise<number | undefined> {
    const { args } = props;
    if (!this.channel || !(this.channel instanceof TextBasedChannel)) {
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
      await this.channelService?.setAutoDelete(
        (this.channel as TextBasedChannels).id,
        delayMs.asMilliseconds()
      );
      response = `Messages are deleted after ${delayMs.asMilliseconds()}ms`;
    }
    // AUTO DELETE OFF
    else if (args[Args.ACTION] === "stop") {
      await this.channelService?.setAutoDelete((this.channel as TextBasedChannels).id, -1);
      response = "Messages are no longer deleted";
    }
    // ERROR
    else {
      await this.sendHelpMessage();
      return;
    }

    (this.channel as TextChannel)?.setTopic(response);
    this.reply(response);
    return 1;
  }
}
