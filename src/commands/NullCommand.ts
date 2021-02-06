import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";

export default class NullCommand extends Command {
  private _text: string | undefined;

  public constructor(context: ExecutionContext, text?: string) {
    super(context);
    this._text = text;
  }

  public async execute(): Promise<any> {
    return this.ec.channelHelper.watchSend(this._text ?? "Error");
  }
}
