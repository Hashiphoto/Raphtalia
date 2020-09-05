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
    if (this.message.mentionedMembers.length === 0) {
      return this.sendHelpMessage();
    }

    for (let i = 0; i < this.message.mentionedMembers.length; i++) {
      const target = this.message.mentionedMembers[i];
      if (!this.memberController.hasAuthorityOver(this.sender, target)) {
        this.memberController.addInfractions(this.sender).then((feedback) => {
          return this.inputChannel.watchSend(
            `You must hold a higher rank than ${target} to kick them\n${feedback ?? ""}\n`
          );
        });
      } else {
        target
          .kick()
          .then((member) => {
            let kickGif = this.getRandomKickGif();
            this.inputChannel.watchSend(`:wave: ${member.displayName} has been kicked\n${kickGif}`);
          })
          .catch((e) => {
            this.inputChannel.watchSend("Something went wrong...");
            console.error(e);
          });
      }
    }
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
