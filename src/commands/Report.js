import Command from "./Command.js";
import { addInfractions } from "../controllers/MemberController.js";

class Report extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      this.message.channel.watchSend(
        "Please repeat the command and specify who is being reported"
      );
      return;
    }

    let amount = 1;

    for (let i = 0; i < this.message.args.length; i++) {
      let relMatches = this.message.args[i].match(/^\+?\d+$/g);
      if (relMatches) {
        amount = parseInt(relMatches[0]);
        break;
      }
    }

    this.message.mentionedMembers.forEach((target) => {
      addInfractions(target, this.inputChannel, amount, "Yes sir~!");
    });
  }
}

export default Report;
