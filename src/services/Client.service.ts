import { Client } from "discord.js";
import dayjs from "dayjs";
import guildMemberRoute from "../routes/client/guildMember.route";
import messageRoute from "../routes/client/message.route";
import reactionRoute from "../routes/client/reaction.route";
import secretConfig from "../../config/secrets.config";
import { singleton } from "tsyringe";

@singleton()
class ClientService {
  private _client: Client;

  public constructor() {
    this._client = new Client();
  }

  public getClient(): Client {
    return this._client;
  }

  public async login(): Promise<void> {
    this._client.once("ready", () => {
      console.log(
        `NODE_ENV: ${process.env.NODE_ENV} | ${dayjs(
          new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
        ).format("MMM D, YYYY - h:mmA")}`
      );
    });

    await this._client.login(secretConfig().discord.token).then(() => {
      console.log(`Logged in! Listening for events...`);
    });

    this._client.on("sharedDisconnect", (event) => {
      console.log(`Bot disconnecting\n ${event.reason}\n ${event.code}`);
      process.exit();
    });
  }

  public async configureRoutes(): Promise<void> {
    messageRoute(this._client);
    guildMemberRoute(this._client);
    reactionRoute(this._client);
  }
}

export default ClientService;
