import Command from "./Command";
import ExecutionContext from "../structures/ExecutionContext";

export default class NullCommand extends Command {
  private text: string | undefined;

  public constructor(context: ExecutionContext, text?: string) {
    super(context);
    this.text = text;
  }

  public async execute(): Promise<any> {
    return this.ec.channelHelper.watchSend(this.text ?? "Error");
  }
}
