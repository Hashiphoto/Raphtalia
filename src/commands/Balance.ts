import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import Discord from "discord.js";
import ExecutionContext from "../structures/ExecutionContext.js";
import RNumber from "../structures/RNumber.js";

class Balance extends Command {
  constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**Balance**\nGet your current balance sent to you in a direct message";
    this.usage = "Usage: `Balance`";
  }

  async execute(): Promise<any> {
    const dmChannel = await this.ec.initiator.createDM();
    const balance = await this.ec.currencyController.getCurrency(this.ec.initiator);

    dmChannel
      .send(`You have ${RNumber.formatDollar(balance)} in ${this.ec.guild.name}`)
      .then(() => this.useItem());
  }
}

export default Balance;
