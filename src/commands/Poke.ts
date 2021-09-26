import { GuildMember, MessageActionRow, MessageButton, TextChannel } from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export default class Poke extends Command {
  public static POKE_BACK_CMD = "Command.Poke.Back";

  public constructor() {
    super();
    this.name = "Poke";
    this.instructions = "**Poke**\nI will poke the targeted member for you";
    this.usage = "Usage: `Poke @member`";
  }

  public async executeDefault(cmdMessage: CommmandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    return this.execute(cmdMessage.message.member, cmdMessage.memberMentions);
  }

  public async execute(initiator: GuildMember, targets: GuildMember[]): Promise<any> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      return this.reply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    let successes = 0;

    await Promise.all(
      targets.map((target) =>
        target.createDM().then((dmChannel) => {
          const row = new MessageActionRow().addComponents(
            new MessageButton().setLabel("Poke Back").setStyle(1).setCustomId(Poke.POKE_BACK_CMD)
          );
          return dmChannel
            .send({
              content: `${initiator.displayName} poked you!`,
              components: [row],
            })
            .then(() => successes++);
        })
      )
    );

    return this.reply(`Sent ${successes} poke${successes > 1 ? "s" : ""}!`).then(() =>
      this.useItem(initiator, targets.length)
    );
  }
}
