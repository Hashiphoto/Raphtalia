class TestGuildController {
  getLeaderRole() {
    return Promise.resolve();
  }

  setCensorship(start) {
    this.isCensoring = start;
    return Promise.resolve(start);
  }

  setMinLength() {
    return Promise.resolve();
  }

  setCharacterValue() {
    return Promise.resolve();
  }

  setMaxPayout() {
    return Promise.resolve();
  }

  setBasePayout() {
    return Promise.resolve();
  }

  setTaxRate() {
    return Promise.resolve();
  }

  setBaseIncome() {
    return Promise.resolve();
  }

  removeStatusMessage() {
    return Promise.resolve();
  }

  setStatusMessage() {
    return Promise.resolve();
  }
}

export default TestGuildController;
