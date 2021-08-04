import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";
import { Result } from "../../enums/Result";

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
      if (error.name === "MemberLimitError") {
        return this.ec.channelHelper.watchSend(error.message);
      } else if (error instanceof RangeError) {
        return this.ec.channelHelper.watchSend(error.message);
      } else if (error.result === Result.OnCooldown) {
        return this.ec.channelHelper.watchSend(`This role cannot be contested yet`);
      } else {
        throw error;
      }
    }

    return this.useItem();
  }
}
