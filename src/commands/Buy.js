import Discord from "discord.js";

import Command from "./Command.js";
import db from "../db/db.js";
import { addCurrency } from "../util/currencyManagement.js";
import { getNextRole, promoteMember } from "../util/roleManagement.js";

class Buy extends Command {
  async execute() {
    if (!this.message.args || this.message.args.length === 0) {
      return this.message.channel.watchSend(`Usage: !Buy (Item Name)`);
    }
    // Get store items
    switch (this.message.args[0]) {
      case "promotion":
        let nextRole = getNextRole(this.message.sender, this.message.guild);
        if (!nextRole) {
          return this.message.channel.watchSend(
            `You cannot be promoted any higher!`
          );
        }

        let dbRole = await db.roles.getSingle(nextRole.id);
        db.users
          .get(this.message.sender.id, this.message.guild.id)
          .then((dbUser) => {
            if (dbUser.currency < dbRole.price) {
              return this.message.channel.watchSend(
                `You cannot afford a promotion. Promotion to ${
                  nextRole.name
                } costs $${dbRole.price.toFixed(2)}`
              );
            }
            addCurrency(this.message.sender, -dbRole.price);
            promoteMember(this.message.channel, null, this.message.sender);
          });
        break;
      default:
        return this.message.channel.watchSend(`Unknown item`);
    }
  }
}

export default Buy;
