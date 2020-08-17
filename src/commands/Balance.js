import Discord from "discord.js";

import Command from "./Command.js";
import { reportCurrency } from "../controllers/CurrencyController.js";

class Balance extends Command {
  execute() {
    this.sender.createDM().then((dmChannel) => {
      reportCurrency(this.sender, dmChannel);
    });
  }
}

export default Balance;
