import { Client } from "discord.js";

export default (client: Client): void => {
  client.on("guildMemberAdd", async (member) => {
    const welcomeChannel = member.guild.systemChannel;
    if (!welcomeChannel) {
      return;
    }
    const deleteTime = await this.getDeleteTime(welcomeChannel);

    const context = new ExecutionContext(this.db, client, member.guild).setChannelHelper(
      new ChannelHelper(welcomeChannel, deleteTime)
    );

    new OnBoarder(context, member).onBoard();
  });

  client.on("guildMemberRemove", (member) => {
    this.db.users.setCitizenship(member.id, member.guild.id, false);
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    // Check if roles changed
    const differentSize = oldMember.roles.cache.size !== newMember.roles.cache.size;
    for (const [id, role] of oldMember.roles.cache) {
      if (differentSize || !newMember.roles.cache.has(id)) {
        const context = new ExecutionContext(this.db, client, newMember.guild);
        return new RoleStatusController(context).update();
      }
    }
  });
};
