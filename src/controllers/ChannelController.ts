import Controller from "./Controller.js";

class ChannelController extends Controller {
  channel;

  constructor(db, channel) {
    super(db);
    this.channel = channel;
  }

  setAutoDelete(enable, deleteDelay) {
    if (!enable) {
      deleteDelay = -1;
    }

    return this.db.channels.setAutoDelete(this.channel.id, deleteDelay);
  }
}

export default ChannelController;
