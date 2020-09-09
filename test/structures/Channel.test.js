class TestChannel {
  constructor() {
    this.output = "";
  }

  watchSend(text) {
    this.output += text;
    return Promise.resolve(text);
  }
}

export default TestChannel;
