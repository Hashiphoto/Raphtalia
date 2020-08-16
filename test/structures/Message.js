import Channel from "./Channel.js";

class Message {
  channel;

  constructor() {
    this.channel = new Channel();
    this.sender = "";
  }
}

export default Message;
