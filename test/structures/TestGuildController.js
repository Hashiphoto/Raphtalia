class TestGuildController {
  getLeaderRole() {
    return Promise.resolve();
  }

  setCensorship(start) {
    this.isCensoring = start;
    return Promise.resolve(start);
  }

  removeStatusMessage() {
    return Promise.resolve();
  }

  setStatusMessage() {
    return Promise.resolve();
  }
}

export default TestGuildController;
