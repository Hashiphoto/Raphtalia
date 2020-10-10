class TestChannelController {
  constructor() {
    this.channel = { enable: null, deleteDelay: null };
  }

  setAutoDelete(enable, deleteDelay) {
    this.channel.enable = enable;
    this.channel.deleteDelay = deleteDelay;
    return Promise.resolve();
  }
}

export default TestChannelController;
