import {
  User as DsUser,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  TextChannel,
} from "discord.js";

import Command from "./Command";
import CommmandMessage from "../models/CommandMessage";
import RaphError from "../models/RaphError";
import { RaphtaliaInteraction } from "../enums/Interactions";
import { Result } from "../enums/Result";
import { autoInjectable } from "tsyringe";
import { buildCustomId } from "../utilities/Util";

@autoInjectable()
export default class Poke extends Command {
  public pokeBack: (interaction: MessageComponentInteraction, args: string[]) => void;

  public constructor() {
    super();
    this.name = "Poke";
    this.instructions = "I will poke the targeted member for you";
    this.usage = "`Poke @member`";
    this.aliases = [this.name.toLowerCase()];

    // interaction callbacks
    this.pokeBack = async (
      interaction: MessageComponentInteraction,
      args: string[]
    ): Promise<void> => {
      console.log(JSON.stringify(interaction, null, " "));
      interaction.update({ components: [] });

      if (!args.length) {
        interaction.followUp(`Ah, I don't know who to poke. Sorry`);
        return;
      }

      const target = await this.clientService?.getClient().users.fetch(args[0]);
      if (!target) {
        interaction.followUp(
          `Hm, I couldn't contact that user. Maybe they aren't in any guilds that I'm in`
        );
        return;
      }

      this.sendPoke(target, interaction.user).then(() => interaction.followUp("Poke sent!"));
    };
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
        this.sendPoke(target.user, initiator.user)
          .then(() => successes++)
          .catch(() => {
            // swallow
          })
      )
    );

    return this.reply(`Sent ${successes} poke${successes > 1 ? "s" : ""}!`).then(() =>
      this.useItem(initiator, targets.length)
    );
  }

  private async sendPoke(target: DsUser, initiator: DsUser): Promise<Message> {
    return target.createDM().then((dmChannel) => {
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel("Poke Back")
          .setStyle(1)
          .setCustomId(buildCustomId(RaphtaliaInteraction.COMMAND_POKE_BACK, initiator.id))
      );
      return dmChannel.send({
        content: `${initiator.toString()} poked you!`,
        components: [row],
      });
    });
  }
}
