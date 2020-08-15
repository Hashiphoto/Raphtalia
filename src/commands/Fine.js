import Discord from "discord.js";

import Command from "./Command.js";
import { extractNumber } from "../util/format.js";
import { addCurrency } from "../util/currencyManagement.js";

class Fine extends Command {
  execute() {
    if (
      !this.message.mentionedMembers ||
      this.message.mentionedMembers.length === 0
    ) {
      return this.inputChannel.watchSend(
        "Please try again and specify who is being fined"
      );
    }

    let amount = 1;
    this.message.args.forEach((arg) => {
      let temp = extractNumber(arg).number;
      if (temp) {
        amount = temp;
        return;
      }
    });
    addCurrency(
      this.message.sender,
      amount * this.message.mentionedMembers.length
    );
    for (let i = 0; i < this.message.mentionedMembers.length; i++) {
      addCurrency(this.message.mentionedMembers[i], -amount);
    }
    let reply =
      `Fined $${amount.toFixed(2)}` +
      (this.message.mentionedMembers.length > 1 ? ` each!` : `!`);
    this.inputChannel.watchSend(reply);
  }
}

export default Fine;
