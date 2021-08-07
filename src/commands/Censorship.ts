import BanListService from "../services/message/BanWordList.service";
import Command from "./Command";
import CommmandMessage from "../models/dsExtensions/CommandMessage";
import { GuildMember } from "discord.js";
import GuildService from "../services/Guild.service";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

enum Args {
  ACTION,
}

@autoInjectable()
export default class Censorship extends Command {
  public constructor(
    private _guildService?: GuildService,
    private _banListService?: BanListService
  ) {
    super();
    this.instructions =
      "**Censorship**\nEnable or disable censorship for the whole server. " +
      "When censorship is enabled, anyone who uses a word from the banned " +
      "list will be given an infraction";
    this.usage = "Usage: `Censorship (start|stop)`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.member) {
      throw new RaphError(Result.NoGuild);
    }
    return this.execute(cmdMessage.member, cmdMessage.args);
  }

  public async execute(initiator: GuildMember, args: string[]): Promise<any> {
    if (args.length === 0) {
      await this.sendHelpMessage();
      return;
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
      return this.sendHelpMessage("Please specify either `start` or `stop`");
    }

    await this._guildService?.setCensorship(initiator.guild.id, start);
    await this.reply(response);
    this._banListService?.update();
    this.useItem(initiator);
  }
}
