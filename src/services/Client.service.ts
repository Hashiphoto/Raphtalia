import { Client, Guild as DsGuild, GuildMember } from "discord.js";

import RaphError from "../models/RaphError";
import { Result } from "../enums/Result";
import dayjs from "dayjs";
import guildMemberRoute from "../routes/guildMember.route";
import messageRoute from "../routes/message.route";
import reactionRoute from "../routes/reaction.route";
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
