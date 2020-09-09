class TestGuildController {
  setCensorship(start) {
    this.isCensoring = start;
    return Promise.resolve(start);
  }
}

export default TestGuildController;
