import {
  CommandInteraction,
  Message,
  MessageOptions,
  MessagePayload,
  PartialTextBasedChannelFields,
} from "discord.js";

export default class InteractionChannel implements PartialTextBasedChannelFields {
  private _interaction: CommandInteraction;

  public constructor(interaction: CommandInteraction) {
    this._interaction = interaction;
  }

  public async send(options: string | MessagePayload | MessageOptions): Promise<Message> {}
}
