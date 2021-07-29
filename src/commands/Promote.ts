import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";
import { Result } from "../enums/Result";

export default class Promote extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Promote**\nIncrease your rank by one";
    this.usage = "Usage: `Promote`";
  }

  public async execute(): Promise<any> {
    try {
      await this.ec.memberController.protectedPromote(this.ec.initiator);
    } catch (error) {
      console.log(typeof error);
      if (error.name === "MemberLimitError") {
        console.log(1);
        return this.ec.channelHelper.watchSend(error.message);
      } else if (error instanceof RangeError) {
        console.log(2);
        return this.ec.channelHelper.watchSend(error.message);
      } else if (error.result === Result.OnCooldown) {
        console.log(3);
        return this.ec.channelHelper.watchSend("No");
      } else {
        console.log(4);
        throw error;
      }
    }

    return this.useItem();
  }
}
