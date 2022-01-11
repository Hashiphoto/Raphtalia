import {
  CommandInteraction,
  Message,
  MessageOptions,
  MessagePayload,
  PartialTextBasedChannelFields,
} from "discord.js";

import MessageService from "../services/Message.service";
import { container } from "tsyringe";

export default class InteractionChannel implements PartialTextBasedChannelFields {
  private _interaction: CommandInteraction;
  private _ephemeral: boolean;
  private _messageService?: MessageService;

  public constructor(interaction: CommandInteraction, ephemeral = false) {
    this._interaction = interaction;
    this._ephemeral = ephemeral;
    this._messageService = container.resolve(MessageService);
  }

  public async send(options: string | MessagePayload | MessageOptions): Promise<Message> {
    const msgOptions = (
      typeof options === "string"
        ? ({ content: options } as MessageOptions)
        : (options as MessagePayload)?.options
        ? (options as MessagePayload).options
        : options
    ) as MessageOptions;

    const response = await (this._interaction.replied
      ? this._interaction.followUp({ ...msgOptions, ephemeral: this._ephemeral })
      : this._interaction.reply({ ...msgOptions, ephemeral: this._ephemeral }));

    // Ephemeral responses cannot be fetched or deleted
    if (!this._ephemeral) {
      const botReply = await this._interaction.fetchReply();
      if (botReply instanceof Message) {
        this._messageService?.handleMessage(botReply as Message).catch((e) => {
          console.error(e);
        });
      }
      return botReply as Message;
    }

    return response as Message;
  }
}
