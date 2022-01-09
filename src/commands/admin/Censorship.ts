import BanListService from "../../services/message/BanWordList.service";
import Command from "../Command";
import CommandMessage from "../../models/CommandMessage";
import GuildService from "../../services/Guild.service";
import { IArgsProps } from "../../interfaces/CommandInterfaces";
import RaphError from "../../models/RaphError";
import { Result } from "../../enums/Result";
import { TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";

enum Args {
  ACTION,
}

@autoInjectable()
export default class Censorship extends Command<IArgsProps> {
  public constructor(
    private _guildService?: GuildService,
    private _banListService?: BanListService
  ) {
    super();
    this.name = "Censorship";
    this.instructions =
      "Enable or disable censorship for the whole server. " +
      "When censorship is enabled, anyone who uses a word from the banned " +
      "list will be given an infraction";
    this.usage = "`Censorship (start|stop)`";
    this.aliases = [this.name.toLowerCase()];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member, args: cmdMessage.args });
  }

  public async execute({ initiator, args }: IArgsProps): Promise<number | undefined> {
    if (args.length === 0) {
      return this.sendHelpMessage();
    }

    let response: string;
    let start: boolean;

    if (args[Args.ACTION] === "start") {
      response = "Censorship is enabled";
      start = true;
    } else if (args[Args.ACTION] === "stop") {
      response = "All speech is permitted!";
      start = false;
    } else {
      await this.sendHelpMessage("Please specify either `start` or `stop`");
      return;
    }

    await this._guildService?.setCensorship(initiator.guild.id, start);
    await this.reply(response);
    this._banListService?.update(initiator.guild);
    return 1;
  }
}
