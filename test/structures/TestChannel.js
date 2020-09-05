class TestChannel {
  constructor() {
    this.output = "";
  }

  watchSend(text) {
    this.output += text;
    return text;
  }
}

export default TestChannel;
