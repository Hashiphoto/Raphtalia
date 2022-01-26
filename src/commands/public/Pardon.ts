import { CommandInteraction, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { ITargettedProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import MemberService from "../../services/Member.service";
import Command from "../Command";

@autoInjectable()
export default class Pardon extends Command<ITargettedProps> {
  public pardon: (interaction: CommandInteraction) => void;

  public constructor(@inject(delay(() => MemberService)) private _memberService?: MemberService) {
    super();
    this.name = "Pardon";
    this.instructions =
      "Removes all infractions from the specified member(s). " +
      "If the members are exiled, they are also freed from exile";
    this.aliases = [this.name.toLowerCase()];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Pardon,
        description: "Free a user from exile and forgive all infractions",
        options: [
          {
            name: "user",
            description: "The user to exile",
            type: "USER",
            required: true,
          },
        ],
      },
    ];

    // interaction callbacks
    this.pardon = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }
      const user = interaction.options.getUser("user", true);
      const target = user ? await interaction.guild?.members.fetch(user) : undefined;
      if (!target) {
        return interaction.reply(`No user was specified or they are not members of the server`);
      }

      this.channel = new InteractionChannel(interaction);

      return this.runWithItem({ initiator, targets: [target] });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;
    await this.runWithItem({
      initiator: cmdMessage.message.member,
      targets: cmdMessage.memberMentions,
    });
  }

  public async execute({ targets }: ITargettedProps): Promise<number | undefined> {
    if (targets.length === 0) {
      await this.sendHelpMessage();
      return;
    }

    if (!this.item.unlimitedUses && targets.length > this.item.remainingUses) {
      this.queueReply(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
      return;
    }

    const pardonPromises = targets.map((target) => this._memberService?.pardonMember(target));

    await Promise.all(pardonPromises)
      .then((messages) => messages.join(""))
      .then((response) => this.queueReply(response));
    return targets.length;
  }
}
