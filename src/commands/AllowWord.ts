import Command from "./Command.js";
import ExecutionContext from "../structures/ExecutionContext.js";

export default class AllowWord extends Command {
  public constructor(context: ExecutionContext) {
    super(context);
    this.instructions = "**AllowWord**\nRemove a word from the ban list";
    this.usage = "Usage: `AllowWord word1 word2 etc`";
  }

  public async execute(): Promise<any> {
    // TODO: Check if censorship is enabled at all
    let words = this.ec.messageHelper.args;
    if (words.length === 0) {
      return this.sendHelpMessage();
    }

    if (!this.item.unlimitedUses && words.length > this.item.remainingUses) {
      return this.ec.channelHelper.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${words.length}/${this.item.remainingUses} remaining uses`
      );
    }

    return this.ec.censorController
      .deleteWords(words)
      .then(() => this.ec.banListStatusController.update())
      .then(() => this.ec.channelHelper.watchSend("Banned words list has been updated"))
      .then(() => this.useItem(words.length));
  }
}
