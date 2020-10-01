import Discord from "discord.js";
import GuildBasedController from "./GuildBasedController.js";

class CurrencyController extends GuildBasedController {
  payoutMessage(message) {
    return this.db.guilds.get(message.guild.id).then((dbGuild) => {});
  }

  addCurrency(member, amount = 1) {
    return this.db.users.incrementCurrency(member.id, member.guild.id, amount);
  }

  transferCurrency(fromMember, toMember, amount) {
    return this.db.users
      .incrementCurrency(fromMember.id, this.guild.id, amount)
      .then(this.db.users.incrementCurrency(toMember.id, this.guild.id, -amount));
  }

  getUserIncome(member) {
    return this.db.users.get(member.id, member.guild.id).then((dbUser) => {
      // Check for personally-set income
      let bonusIncome = 0;
      if (dbUser.bonus_income != 0) {
        bonusIncome = dbUser.bonus_income;
      }
      // Check for role income
      if (!member.hoistRole) {
        return bonusIncome;
      }
      return this.db.roles.getSingle(member.hoistRole.id).then((dbRole) => {
        if (!dbRole) {
          return bonusIncome;
        }

        return dbRole.income;
      });
    });
  }

  getCurrency(member) {
    return this.db.users.get(member.id, member.guild.id).then((user) => {
      return user.currency;
    });
  }
}

export default CurrencyController;
