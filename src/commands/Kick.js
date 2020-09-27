import Command from "./Command.js";
import links from "../../resources/links.js";
import MemberController from "../controllers/MemberController.js";

class Kick extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
  }

  execute() {
    const targets = this.message.mentionedMembers;
    if (targets.length === 0) {
      return this.sendHelpMessage();
    }

    if (targets.length > this.item.remainingUses) {
      return this.inputChannel.watchSend(
        `Your ${this.item.name} does not have enough charges. ` +
          `Attempting to use ${targets.length}/${this.item.remainingUses} remaining uses`
      );
    }

    if (!this.sender.hasAuthorityOver(targets)) {
      return this.memberController
        .addInfractions(this.sender)
        .then((feedback) =>
          this.inputChannel.watchSend(
            `You must hold a higher rank than the members you are kicking\n` + feedback
          )
        );
    }

    const kickPromises = targets.map((target) => {
      return target
        .kick()
        .then((member) => {
          let kickGif = this.getRandomKickGif();
          return `:wave: ${member.displayName} has been kicked\n${kickGif}`;
        })
        .catch((e) => {
          console.error(e);
          return `Could not kick ${target.displayName}`;
        });
    });

    return Promise.all(kickPromises)
      .then((messages) => messages.reduce(this.sum))
      .then((response) => this.inputChannel.watchSend(response))
      .then(() => this.useItem(targets.length));
  }

  getRandomKickGif() {
    let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
    return links.gifs.kicks[randInt];
  }

  sendHelpMessage() {
    return this.inputChannel.watchSend("Usage: `Kick @target`");
  }
}

export default Kick;
