import ExecutionContext from "../structures/ExecutionContext.js";

export default class GuildBasedController {
  protected ec: ExecutionContext;

  public constructor(context: ExecutionContext) {
    this.ec = context;
  }
}
