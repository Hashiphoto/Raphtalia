/**
 * Currently broken
 *
 * TODO: Reassess whether it's needed or not
 */

class Unarrive extends Command {
  execute(): Promise<any> {
    let target = this.sender;
    if (this.message.mentionedMembers.length > 0) {
      target = this.message.mentionedMembers[0];
    }

    return this.db.users
      .setCitizenship(target.id, member.guild.id, false)
      .then(() => {
        return target.roles.forEach((role) => {
          target.removeRole(role);
        });
      })
      .then(() => {
        return this.ec.channelHelper.watchSend(`${target}'s papers have been deleted from record`);
      });
  }
}

export default Unarrive;
