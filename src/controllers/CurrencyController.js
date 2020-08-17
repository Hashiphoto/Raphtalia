import Discord from "discord.js";

class CurrencyController {
  db;

  constructor(db) {
    this.db = db;
  }

  payoutMessage(message, dbGuild) {
    var amount = this.calculatePayout(message, dbGuild);

    if (!amount) {
      return;
    }

    let sender = message.guild.members.get(message.author.id);

    return this.addCurrency(sender, amount);
  }

  calculatePayout(message, dbGuild) {
    if (message.content.length < dbGuild.min_length) {
      return 0;
    }

    return Math.min(
      dbGuild.base_payout + message.content.length * dbGuild.character_value,
      dbGuild.max_payout
    );
  }

  addCurrency(member, amount = 1) {
    return this.db.users.incrementCurrency(member.id, member.guild.id, amount);
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
