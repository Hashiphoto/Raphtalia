import { Client } from "discord.js";
import MessageService from "../services/Message.service";
import { container } from "tsyringe";

export default (client: Client): void => {
  client.on("message", async (message) => {
    const messageService = container.resolve(MessageService);
    messageService.handleMessage(message);
  });
};
