import { Guild, Message, RoleManager } from "discord.js";

import { ChannelHelper } from "../ChannelHelper";
import Command from "../commands/Command";
import { MessageHelper } from "../MessageHelper";

export class Context {
  public message: Message;
  public guild: Guild;
  public channelHelper: ChannelHelper;
  public messageHelper: MessageHelper;
  public command: Command;

  constructor(message: Message, channelHelper: ChannelHelper) {
    this.message = message;
    if (message.guild) {
      this.guild = message.guild;
      this.roleManager = message.guild.roles;
    }
    this.channelHelper = channelHelper;
  }
}
