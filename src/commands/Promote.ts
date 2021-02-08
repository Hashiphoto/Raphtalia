import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import MemberLimitError from "../structures/errors/MemberLimitError";

export default class Promote extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Promote**\nIncrease your rank by one";
    this.usage = "Usage: `Promote`";
  }

  public async execute(): Promise<any> {
    return this.ec.memberController
      .protectedPromote(this.ec.initiator)
      .then((feedback) => this.ec.channelHelper.watchSend(feedback))
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
