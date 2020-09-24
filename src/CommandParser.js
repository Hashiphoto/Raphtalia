import Discord from "discord.js";

class CommandParser {
  static prefix = "!";

  /**
   * Separates the message's arguments and finds the mentioned roles/members
   * @param {Discord.Message} message
   */
  static parse(message) {
    message.args = message.content.slice(CommandParser.prefix.length).split(/\s+/);
    message.command = message.args.shift().toLowerCase();
    message.sender = message.member;
    message.mentionedMembers = CommandParser.getMemberMentions(message.guild, message.args);
    message.mentionedRoles = CommandParser.getRoleMentions(message.guild, message.args);
    message.content = message.content
      .slice(CommandParser.prefix.length + message.command.length)
      .trim();

    return message;
  }

  /**
   * Parses args and returns the user mentions in the order given
   *
   * @param {Discord.Guild} guild - The guild to search for members/roles
   * @param {String[]} args - An array of strings to parse for mentions
   * @returns {Discord.GuildMember[]} - An array of guildMember objects
   */
  static getMemberMentions(guild, args) {
    let members = [];
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
  static getRoleMentions(guild, args) {
    let roles = [];
    for (let i = 0; i < args.length; i++) {
      let roleMatches = args[i].match(/<@&(\d+)>/);
      if (roleMatches) {
        let role = guild.roles.get(roleMatches[1]);
        roles.push(role);
      }
    }

    return roles;
  }

  /**
   * Removes the prefix and suffix characters from a mention.
   * Discord mentions are the user or role id surrounded by < > and other characters
   * Read the Discord.js documentation for more info
   *
   * @param {String} mention - A string containing a mention
   * @returns {Discord.GuildMember} The guild member that the mention refers to
   */
  static getMemberFromMention(guild, mention) {
    // The id is the first and only match found by the RegEx.
    let memberMatches = mention.match(/<@!?(\d+)>/);
    if (memberMatches) {
      // The first element in the matches array will be the entire mention, not just the ID,
      // so use index 1.
      return guild.members.get(memberMatches[1]);
    }

    // Check if a role was mentioned instead
    let roleMatches = mention.match(/<@&(\d+)>/);
    if (roleMatches) {
      let role = guild.roles.get(roleMatches[1]);
      return role.members.array();
    }
  }
}

export default CommandParser;
