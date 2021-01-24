import { DMChannel, StringResolvable, TextChannel } from "discord.js";

export default class ChannelHelper {
  public deleteMessageDelay: number;

  public channel: TextChannel;

  public constructor(channel: TextChannel, deleteMessageDelay: number) {
    this.channel = channel;
    this.deleteMessageDelay = deleteMessageDelay;
  }

  public watchSend = (content: StringResolvable, options: any = undefined) => {
    return (options ? this.channel.send(content, options) : this.channel.send(content)).then(
      (message) => {
        if (this.deleteMessageDelay >= 0) {
          message.delete({ timeout: this.deleteMessageDelay });
        }
        return message;
      }
    );
  };
}
