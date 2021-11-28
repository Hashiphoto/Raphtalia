import BanListService from "../services/message/BanWordList.service";
import Command from "./Command";
import CommandMessage from "../models/CommandMessage";
import { ICommandProps } from "../interfaces/CommandInterfaces";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { TextChannel } from "discord.js";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class BanList extends Command<ICommandProps> {
  public constructor(private _banListService?: BanListService) {
    super();
    this.name = "BanList";
    this.instructions = "Post the Banned Words List in this channel";
    this.usage = "`BanList`";
    this.aliases = [this.name.toLowerCase(), "bannedwords"];
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({ initiator: cmdMessage.message.member });
  }

  public async execute({ initiator }: ICommandProps): Promise<number | undefined> {
    if (!this.channel) {
      throw new RaphError(Result.ProgrammingError, "The channel is undefined");
    }

    await this._banListService?.removeMessage(initiator.guild);

    // Do asyncrhonously
    this._banListService?.postEmbed(this.channel);

    return 1;
  }
}
