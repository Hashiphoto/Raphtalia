import {
  CommandInteraction,
  Message,
  MessageOptions,
  MessagePayload,
  PartialTextBasedChannelFields,
} from "discord.js";

export default class InteractionChannel implements PartialTextBasedChannelFields {
  private _interaction: CommandInteraction;
  private _ephemeral: boolean;

  public constructor(interaction: CommandInteraction, ephemeral = false) {
    this._interaction = interaction;
    this._ephemeral = ephemeral;
  }

  public async send(options: string | MessagePayload | MessageOptions): Promise<Message> {
    const msgOptions = (
      typeof options === "string"
        ? ({ content: options } as MessageOptions)
        : (options as MessagePayload)?.options
        ? (options as MessagePayload).options
        : options
    ) as MessageOptions;

    const response = this._interaction.replied
      ? await this._interaction.followUp({ ...msgOptions, ephemeral: this._ephemeral })
      : await this._interaction.reply({ ...msgOptions, ephemeral: this._ephemeral });
    return response as Message;
  }
}
