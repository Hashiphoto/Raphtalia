class TestCurrencyController {
  constructor() {
    this.db = new Map();
  }

  payoutMessage() {
    return Promise.resolve();
  }

  calculatePayout() {
    return Promise.resolve();
  }

  async addCurrency(target, amount) {
    this.db.set(target, (await this.getCurrency(target)) + amount);
    return Promise.resolve();
  }

  transferCurrency() {
    return Promise.resolve();
  }

  getUserIncome() {
    return Promise.resolve();
  }

  getCurrency(target) {
    return Promise.resolve(this.db.get(target) ?? 0);
  }
}

export default TestCurrencyController;
