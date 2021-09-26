import { Client, Guild as DsGuild, GuildMember, Intents } from "discord.js";

import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import configureRoutes from "../routes/client.router";
import dayjs from "dayjs";
import secretConfig from "../config/secrets.config";
import { singleton } from "tsyringe";

@singleton()
class ClientService {
  private _client: Client;

  public constructor() {
    this._client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
      ],
    });
  }

  /**
   * This must be run once after initialization
   */
  public async login(): Promise<void> {
    if (!this._client) {
      throw new RaphError(Result.ProgrammingError, "client is undefined");
    }
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
    configureRoutes(this._client);
  }

  public getClient(): Client {
    return this._client;
  }

  public getRaphtaliaMember(guild: DsGuild): GuildMember {
    if (!this._client.user) {
      throw new RaphError(Result.NotFound);
    }
    const raphtalia = guild.members.cache.get(this._client.user.id);
    if (!raphtalia) {
      throw new RaphError(Result.NotFound);
    }
    return raphtalia;
  }
}

export default ClientService;
