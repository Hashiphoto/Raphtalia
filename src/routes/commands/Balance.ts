import Command from "./Command";
import ExecutionContext from "../../models/ExecutionContext";
import RNumber from "../../models/RNumber";

export default class Balance extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Balance**\nGet your current balance sent to you in a direct message";
    this.usage = "Usage: `Balance`";
  }

  public async execute(): Promise<any> {
    const showPublic =
      this.ec.messageHelper.args.length > 0 &&
      this.ec.messageHelper.args[0].toLowerCase() === "show";

    const balance = await this.ec.currencyController.getCurrency(this.ec.initiator);
    const messageText = `You have ${RNumber.formatDollar(balance)} in ${this.ec.guild.name}`;

    if (showPublic) {
      this.ec.channelHelper.watchSend(messageText);
    } else {
      const dmChannel = await this.ec.initiator.createDM();
      dmChannel.send(messageText);
    }

    await this.useItem();
  }
}
