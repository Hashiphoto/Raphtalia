import Discord from "discord.js";

import Command from "./Command.js";
import { extractNumber } from "../util/format.js";
import { addCurrency } from "../util/currencyManagement.js";

class DeliverCheck extends Command {
  execute() {
    if (
      this.message.mentionedMembers.length === 0 ||
      !this.message.args ||
      this.message.args.length < 2
    ) {
      return this.inputChannel.watchSend("Usage: `!DeliverCheck @target $1`");
    }

    let amount = extractNumber(this.message.args[this.message.args.length - 1]);
    if (amount.number == null) {
      return this.inputChannel.watchSend("Usage: `!DeliverCheck @target $1`");
    }

    this.message.mentionedMembers.forEach((target) => {
      addCurrency(target, amount.number);
    });
    this.inputChannel.watchSend("Money has been distributed!");
  }
}

export default DeliverCheck;
