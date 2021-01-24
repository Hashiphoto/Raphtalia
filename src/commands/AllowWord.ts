import BanListStatusController from "../controllers/message/BanListStatusController.js";
import CensorController from "../controllers/CensorController.js";
import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";

export default class AllowWord extends Command {
  protected censorController: CensorController;
  protected banlistStatusCtlr: BanListStatusController;
  protected instructions: string;
  protected usage: string;
  protected message: any;
  protected item: any;
  protected inputChannel: any;

  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**AllowWord**\nRemove a word from the ban list";
    this.usage = "Usage: `AllowWord word1 word2 etc`";
  }

  public execute(): Promise<any> {
    // TODO: Check if censorship is enabled at all
    let words = this.message.args;
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      return this.ec.channelHelper.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
    }

    return this.censorController
      .deleteWords(words)
      .then(() => this.banlistStatusCtlr.update())
      .then(() => this.ec.channelHelper.watchSend("Banned words list has been updated"))
      .then(() => this.useItem(words.length));
  }
}
