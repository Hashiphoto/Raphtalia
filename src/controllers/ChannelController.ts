import Controller from "./Controller";

export default class ChannelController extends Controller {
  /**
   * A negative number means deletion is off.
   * A zero or greater means messages will be deleted.
   */
  public setAutoDelete(deleteDelay: number) {
    return this.ec.db.channels.setAutoDelete(this.ec.channel.id, deleteDelay);
  }
}
