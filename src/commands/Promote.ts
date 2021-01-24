import Command from "./Command.js";
import Discord from "discord.js";
import MemberController from "../controllers/MemberController.js";
import MemberLimitError from "../structures/errors/MemberLimitError.js";

class Promote extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions = "**Promote**\nIncrease your rank by one";
    this.usage = "Usage: `Promote`";
  }

  execute(): Promise<any> {
    return this.memberController
      .nextRoleAvailable(this.message.member)
      .then(({ available, role }) => {
        if (available) {
          return this.memberController.promoteMember(this.message.member, role);
        } else {
          const contestMessage =
            `**${this.message.member} is contesting a promotion into the ${role} role!**\n` +
            `🔸 ${this.message.member} and everyone who currently holds the ${role} role can give me money to keep the role. ` +
            `Whoever gives the least amount of money by the end of the contest period will be demoted.\n` +
            `🔸 Contests are resolved at 8PM every day, if at least 24 hours have passed since the start of the contest.\n` +
            `🔸 Use the command \`Give @Raphtalia\` to pay me\n`;
          if (this.inputChannel.autoDelete) {
            return this.message.guild.systemChannel
              .send(contestMessage)
              .then(
                () =>
                  `A contest has been initiated. See ${this.message.guild.systemChannel} for the announcement`
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

export default Promote;
