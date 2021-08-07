import { Guild as DsGuild, Role as DsRole, GuildMember, Message } from "discord.js";

export default class CommmandMessage extends Message {
  public static COMMAND_PREFIX = "!";

  private _args: string[] | undefined;
  private _parsedContent: string | undefined;
  private _memberMentions: GuildMember[] | undefined;
  private _mentionedRoles: DsRole[] | undefined;

  // Every word in the message, separated by whitespace
  public get allArgs(): string[] {
    if (!this._args) {
      this._args = this.content.split(/\s+/).map((s) => s.toLowerCase());
    }
    return this._args;
  }

  // Every word in the message, minus the command
  public get args(): string[] {
    return this.allArgs.slice(1);
  }

  // The command is the first word in the message
  public get command(): string {
    return this.allArgs[0];
  }

  // The content, without the leading command
  public get parsedContent(): string {
    if (!this._parsedContent) {
      this._parsedContent = this.content
        .slice(CommmandMessage.COMMAND_PREFIX.length + this.command.length)
        .trim();
    }
    return this._parsedContent;
  }

  public get memberMentions(): GuildMember[] {
    if (!this.guild) {
      return [];
    }
    if (!this._memberMentions) {
      let members = new Array<GuildMember>();
      for (let i = 0; i < this.allArgs.length; i++) {
        const member = this.getMemberFromMention(this.guild, this.allArgs[i]);
        if (!member) {
          continue;
        }
        members = members.concat(member);
      }
      this._memberMentions = members;
    }

    return this._memberMentions;
  }

  public get roleMentions(): DsRole[] {
    if (!this.guild) {
      return [];
    }
    if (!this._mentionedRoles) {
      this._mentionedRoles = [];
      for (let i = 0; i < this.allArgs.length; i++) {
        const roleMatches = this.allArgs[i].match(/<@&(\d+)>/);
        if (!roleMatches) {
          continue;
        }
        const role = this.guild.roles.cache.get(roleMatches[1]);
        if (role) {
          this._mentionedRoles.push(role);
        }
      }
    }

    return this._mentionedRoles;
  }

  /**
   * Removes the prefix and suffix characters from a mention.
   * Discord mentions are the user or role id surrounded by < > and other characters
   * Read the Discord.js documentation for more info
   */
  private getMemberFromMention(guild: DsGuild, mention: string) {
    // The id is the first and only match found by the RegEx.
    const memberMatches = mention.match(/<@!?(\d+)>/);
    if (memberMatches) {
      // The first element in the matches array will be the entire mention, not just the ID,
      // so use index 1.
      const member = guild.members.cache.get(memberMatches[1]);
      if (!member) {
        return [];
      }
      return [member];
    }

    // Check if a role was mentioned instead
    const roleMatches = mention.match(/<@&(\d+)>/);
    if (!roleMatches) {
      return [];
    }
    const role = guild.roles.cache.get(roleMatches[1]);
    if (!role) {
      return [];
    }
    return role.members.array();
  }
}
