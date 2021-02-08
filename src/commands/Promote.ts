import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";
import MemberLimitError from "../structures/errors/MemberLimitError.js";

export default class Promote extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Promote**\nIncrease your rank by one";
    this.usage = "Usage: `Promote`";
  }

  public async execute(): Promise<any> {
    return this.ec.memberController
      .protectedPromote(this.ec.initiator)
      .then(({ available, role }) => {
        if (available) {
          return this.ec.memberController.promoteMember(this.ec.initiator, role);
        } else {
          const contestMessage =
            `**${this.ec.initiator} is contesting a promotion into the ${role} role!**\n` +
            `🔸 ${this.ec.initiator} and everyone who currently holds the ${role} role can give me money to keep the role. ` +
            `Whoever gives the least amount of money by the end of the contest period will be demoted.\n` +
            `🔸 Contests are resolved at 8PM every day, if at least 24 hours have passed since the start of the contest.\n` +
            `🔸 Use the command \`!Give @Raphtalia $1.00\` to pay me\n`;
          if (this.ec.channelHelper.autoDelete) {
            return this.ec.guild.systemChannel
              .send(contestMessage)
              .then(
                () =>
                  `A contest has been initiated. See ${this.ec.guild.systemChannel} for the announcement`
              );
          }
          return contestMessage;
        }
      })
      .then((response) => this.ec.channelHelper.watchSend(response))
      .then(() => this.useItem())
      .catch((error) => {
        if (error instanceof MemberLimitError) {
          return this.ec.channelHelper.watchSend(error.message);
        }
        if (error instanceof RangeError) {
          return this.ec.channelHelper.watchSend(error.message);
        }
        throw error;
      });
  }
}
