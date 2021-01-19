import Discord, { Guild, GuildMember, Role } from "discord.js";

import { Context } from "./structures/Context";
import { MessageHelper } from "./MessageHelper";

class CommandParser {
  static COMMAND_PREFIX = "!";

  /**
   * Separates the message's arguments and finds the mentioned roles/members
   * @param {Discord.Message} message
   */
  static parse(context: Context) {
    const message = context.message;
    const messageHelper = new MessageHelper();
    // Every word separated by white space
    messageHelper.args = message.content.split(/\s+/);

    // Remove the command from the content
    messageHelper.content = message.content
      .slice(CommandParser.COMMAND_PREFIX.length + messageHelper.command.length)
      .trim();

    if (!message.guild) {
      return messageHelper;
    }
    // Get mention info
    messageHelper.mentionedMembers = CommandParser.getMemberMentions(
      message.guild,
      messageHelper.args
    );
    messageHelper.mentionedRoles = CommandParser.getRoleMentions(message.guild, messageHelper.args);

    return messageHelper;
  }

  /**
   * Parses args and returns the user mentions in the order given
   *
   * @param {Discord.Guild} guild - The guild to search for members/roles
   * @param {String[]} args - An array of strings to parse for mentions
   * @returns {Discord.GuildMember[]} - An array of guildMember objects
   */
  static getMemberMentions(guild: Guild, args: String[]) {
    let members = new Array<GuildMember>();
    for (let i = 0; i < args.length; i++) {
      let member = CommandParser.getMemberFromMention(guild, args[i]);
      if (!member) {
        continue;
      }
      members = members.concat(member);
    }

    return members;
  }

  /**
   * Parses args and returns the user mentions in the order given
   *
   * @param {Discord.Guild} guild - The guild to search for members/roles
   * @param {String[]} args - An array of strings to parse for mentions
   * @returns {Discord.GuildMember[]} - An array of guildMember objects
   */
  static getRoleMentions(guild: Guild, args: String[]) {
    let roles: Role[] = [];
    for (let i = 0; i < args.length; i++) {
      let roleMatches = args[i].match(/<@&(\d+)>/);
      if (!roleMatches) {
        continue;
      }
      let role = guild.roles.cache.get(roleMatches[1]);
      if (role) {
        roles.push(role);
      }
    }

    return roles;
  }

  /**
   * Removes the prefix and suffix characters from a mention.
   * Discord mentions are the user or role id surrounded by < > and other characters
   * Read the Discord.js documentation for more info
   */
  static getMemberFromMention(guild: Guild, mention: String) {
    // The id is the first and only match found by the RegEx.
    let memberMatches = mention.match(/<@!?(\d+)>/);
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
    let roleMatches = mention.match(/<@&(\d+)>/);
    if (!roleMatches) {
      return [];
    }
    let role = guild.roles.cache.get(roleMatches[1]);
    if (!role) {
      return [];
    }
    return role.members.array();
  }
}

export default CommandParser;
