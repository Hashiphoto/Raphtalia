import Discord from "discord.js";

import Command from "./Command.js";
import { reportCurrency } from "../util/currencyManagement.js";

class Balance extends Command {
  execute() {
    this.sender.createDM().then((dmChannel) => {
      reportCurrency(this.sender, dmChannel);
    });
  }
}

export default Balance;
