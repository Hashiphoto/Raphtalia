import Discord from "discord.js";

import Command from "./Command.js";
import CurrencyController from "../controllers/CurrencyController.js";
import { moneyFormat } from "../controllers/format.js";

class Balance extends Command {
  async execute() {
    const dmChannel = await this.sender.createDM();
    const currencyController = new CurrencyController(this.db);
    currencyController.getCurrency(this.sender).then((balance) => {
      dmChannel.send(
        `You have $${moneyFormat(balance)} in ${this.message.guild.name}`
      );
    });
  }
}

export default Balance;
