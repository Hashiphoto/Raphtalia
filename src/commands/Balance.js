import Discord from "discord.js";

import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import RNumber from "../structures/RNumber.js";

class Balance extends Command {
  /**
   * @param {Discord.Message} message
   * @param {CurrencyController} currencyController
   */
  constructor(message, currencyController) {
    super(message);
    this.currencyController = currencyController;
    this.instructions = "**Balance**\nGet your current balance sent to you in a direct message";
    this.usage = "Usage: `Balance`";
  }

  async execute() {
    const dmChannel = await this.sender.createDM();
    return this.currencyController
      .getCurrency(this.sender)
      .then((balance) =>
        dmChannel.send(`You have ${RNumber.formatDollar(balance)} in ${this.message.guild.name}`)
      )
      .then(() => this.useItem());
  }
}

export default Balance;
