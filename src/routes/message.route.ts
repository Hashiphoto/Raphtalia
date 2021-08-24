import { Client } from "discord.js";
import MessageService from "../services/Message.service";
import { container } from "tsyringe";

export default (client: Client): void => {
  const messageService = container.resolve(MessageService);

  client.on("message", async (message) => {
    messageService.handleMessage(message);
  });
};
