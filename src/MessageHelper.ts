import { GuildMember, Role } from "discord.js";

import CommandParser from "./CommandParser";

export class MessageHelper {
  private _args: string[];
  public command: string;
  public mentionedMembers: GuildMember[];
  public mentionedRoles: Role[];
  public content: string;

  public get args(): string[] {
    return this._args;
  }

  public set args(value: string[]) {
    this._args = value;
    if (this._args.length > 0) {
      // Remove the first arg from args, set it as the command, and remove the prefix from it
      this.command = this._args.shift()!.slice(CommandParser.COMMAND_PREFIX.length).toLowerCase();
    }
  }
}
