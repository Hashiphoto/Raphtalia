import ChannelsTable from "../db/ChannelsTable";

class ChannelController {
  db;
  channel;

  constructor(db, channel) {
    this.db = db;
    this.channel = channel;
  }

  setAutoDelete(enable, deleteDelay) {
    if (!enable) {
      deleteDelay = -1;
    }

    return this.db.channels.setAutoDelete(this.channel, deleteDelay);
  }
}

export default ChannelController;
