import dayjs from "dayjs";
import { Duration } from "dayjs/plugin/duration";
import { CommandInteraction, TextChannel } from "discord.js";
import { autoInjectable, delay, inject } from "tsyringe";
import { RaphtaliaInteraction } from "../../enums/Interactions";
import { Result } from "../../enums/Result";
import { ITargettedProps } from "../../interfaces/CommandInterfaces";
import CommandMessage from "../../models/CommandMessage";
import InteractionChannel from "../../models/InteractionChannel";
import RaphError from "../../models/RaphError";
import MemberService from "../../services/Member.service";
import { formatFullDate, parseDuration } from "../../utilities/Util";
import Command from "../Command";

interface IExileProps extends ITargettedProps {
  duration: Duration;
}

@autoInjectable()
export default class Exile extends Command<IExileProps> {
  public exile: (interaction: CommandInteraction) => void;

  public constructor(@inject(delay(() => MemberService)) private _memberService?: MemberService) {
    super();
    this.name = "Exile";
    this.instructions =
      "Put a specified member in exile for a period of time. " +
      "Exiled members cannot use any commands. If no time is specified, the maximum value of 6 hours will be used. ";
    this.aliases = [this.name.toLowerCase()];
    this.slashCommands = [
      {
        name: RaphtaliaInteraction.Exile,
        description: "Prevent a user from using commands for a time",
        options: [
          {
            name: "user",
            description: "The user to exile",
            type: "USER",
            required: true,
          },
          {
            name: "duration",
            description: "How long to exile the user. Default: 1 hour",
            type: "STRING",
            choices: [
              {
                name: "15 minutes",
                value: "15m",
              },
              {
                name: "30 minutes",
                value: "30m",
              },
              {
                name: "1 hour",
                value: "1h",
              },
              {
                name: "2 hours",
                value: "2h",
              },
            ],
          },
        ],
      },
    ];

    // interaction callbacks
    this.exile = async (interaction: CommandInteraction) => {
      if (!interaction.inGuild) {
        return interaction.reply(`Please use this command in a server`);
      }
      const initiator = await interaction.guild?.members.fetch(interaction.user.id);
      if (!initiator) {
        return interaction.reply(`This only works in a server`);
      }

      const durationString = interaction.options.getString("duration") ?? "1h";
      const duration = parseDuration(durationString) ?? dayjs.duration({ hours: 6 });
      const user = interaction.options.getUser("user", true);
      const target = user ? await interaction.guild?.members.fetch(user) : undefined;
      if (!target) {
        return interaction.reply(`No user was specified or they are not members of the server`);
      }

      await interaction.deferReply();
      this.channel = new InteractionChannel(interaction);
      return this.runWithItem({ initiator, duration, targets: [target] });
    };
  }

  public async runFromCommand(cmdMessage: CommandMessage): Promise<void> {
    if (!cmdMessage.message.member) {
      throw new RaphError(Result.NoGuild);
    }
    this.channel = cmdMessage.message.channel as TextChannel;

    // Input or default 6 hours
    const duration = parseDuration(cmdMessage.parsedContent) ?? dayjs.duration({ hours: 6 });

    await this.runWithItem({
      initiator: cmdMessage.message.member,
      targets: cmdMessage.memberMentions,
      duration,
    });
  }

  public async execute({ targets, duration }: IExileProps): Promise<number | undefined> {
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }
    if (targets.length > 1) {
      return this.sendHelpMessage("This command can only target one user at a time");
    }

    // Current time + exile duration
    const releaseDate = dayjs().add(duration);

    const response = targets.reduce(
      (sum, target) =>
        sum + `${target.toString()} has been exiled until ${formatFullDate(releaseDate)}`,
      ""
    );

    const exilePromises = targets.map((target) =>
      this._memberService?.exileMember(target, duration)
    );

    // Important to run asynchronously
    Promise.all(exilePromises);

    this.queueReply(response);
    return targets.length;
  }
}
