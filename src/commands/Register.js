import Discord from "discord.js";

import Command from "./Command.js";
import MemberController from "../controllers/MemberController.js";

class Register extends Command {
  /**
   * @param {Discord.Message} message
   * @param {MemberController} memberController
   */
  constructor(message, memberController) {
    super(message);
    this.memberController = memberController;
    this.instructions =
      "**Register**\nGive the voter role to yourself. " +
      "This will allow you to vote when anyone uses the HoldVote command";
    this.usage = "Usage: `Register`";
  }

  async execute() {
    let voterRole = this.guild.roles.cache.find((r) => r.name === "Voter");
    if (!voterRole) {
      // TODO: consolidate this with HoldVote, which also can create the Voter role
      voterRole = await this.guild.roles.create({
        data: { name: "Voter", hoist: false, color: "#4cd692" },
      });
    }

    if (this.message.member.roles.cache.has(voterRole.id)) {
      return this.inputChannel.watchSend(`You are already a registered voter, dingus`);
    }

    return this.message.member.roles
      .add(voterRole)
      .then(() => {
        this.inputChannel.watchSend(`You are now a registered voter!`);
      })
      .then(() => this.useItem());
  }
}

export default Register;
