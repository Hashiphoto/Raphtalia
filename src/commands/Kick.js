import Command from "./Command.js";
import links from "../../resources/links.js";

class Kick extends Command {
  execute() {
    if (this.message.mentionedMembers.length === 0) {
      this.inputChannel.watchSend(
        "Please repeat the command and specify who is getting the boot"
      );
      return;
    }

    this.message.mentionedMembers.forEach((target) => {
      target
        .kick()
        .then((member) => {
          let kickGif = this.getRandomKickGif();
          this.inputChannel.watchSend(
            `:wave: ${member.displayName} has been kicked\n${kickGif}`
          );
        })
        .catch((e) => {
          this.inputChannel.watchSend("Something went wrong...");
          console.error(e);
        });
    });
  }

  getRandomKickGif() {
    let randInt = Math.floor(Math.random() * links.gifs.kicks.length);
    return links.gifs.kicks[randInt];
  }
}

export default Kick;
