import Command from "./Command.js";

class SoftKick extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      return this.inputChannel.watchSend(
        "Please repeat the command and specify who is being gently kicked"
      );
    }

    this.message.mentionedMembers.forEach((target) => {
      softkickMember(this.inputChannel, target);
    });
  }
}

export default SoftKick;
