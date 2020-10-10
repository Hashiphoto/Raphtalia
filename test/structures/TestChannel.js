class TestChannel {
  constructor() {
    this.output = "";
  }

  watchSend(text) {
    this.output += text;
    return Promise.resolve(text);
  }

  send(text) {
    this.output += text;
    return Promise.resolve(text);
  }

  setTopic(text) {
    this.topic = text;
    return Promise.resolve(text);
  }
}

export default TestChannel;
