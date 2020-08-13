import Discord from "discord.js";
import db from "./db.js";
import sendTimedMessage from "./util/timedMessage.js";
import welcomeQuestions from "../resources/welcome-questions.js";

/**
 * Function called when a new member is added to the guild. First, it checks their papers. If they do not have a papers entry,
 * it creates a new one and sends a greeting. Second, it gives them the immigrant role. Third, it checks if they need a nickname and
 * allows them to assign a new one. Fourth, it asks them to recite a pledge (unless they have already given the pledge).
 * If they do, they are made a comrade. If they don't, they are softkicked
 *
 * @param {Discord.TextChannel} channel - The channel to send messages in
 * @param {Discord.GuildMember} member - The guildMember that is being onboarded
 */
async function arrive(channel, member) {
  if (!channel) return;
  await helper.setHoistedRole(member, discordConfig().roles.immigrant);

  let dbUser = await db.users.get(member.id, member.guild.id);

  // Check if already a citizen
  if (dbUser.citizenship) {
    channel.watchSend(`Welcome back ${member}!`);
    helper.setHoistedRole(member, discordConfig().roles.neutral);
    return;
  }

  channel.watchSend(
    `Welcome ${member} to ${channel.guild.name}!\n` +
      `I just have a few questions for you first. If you answer correctly, you will be granted citizenship.`
  );

  // Set nickname
  try {
    let nickname = await sendTimedMessage(
      channel,
      member,
      welcomeQuestions.nickname
    );
    if (await censorship.containsBannedWords(channel.guild.id, nickname)) {
      helper.softkick(
        channel,
        member,
        "We don't allow those words around here"
      );
      return;
    }
    channel.watchSend(`${member.displayName} will be known as ${nickname}!`);
    member.setNickname(nickname).catch((e) => {
      console.error(e);
      channel.watchSend(
        `Sorry. I don't have permissions to set your nickname...`
      );
    });
  } catch (e) {
    console.error(e);
    channel.watchSend(`${member} doesn't want a nickname...`);
  }

  for (let i = 0; i < welcomeQuestions.gulagQuestions.length; i++) {
    let answeredCorrect = await askGateQuestion(
      channel,
      member,
      welcomeQuestions.gulagQuestions[i]
    );
    if (!answeredCorrect) {
      return;
    }
  }

  // Creates the user in the DB if they didn't exist
  db.users.setCitizenship(member.id, member.guild.id, true);
  channel
    .watchSend(
      `Thank you! And welcome loyal citizen to ${channel.guild.name}! 🎉🎉🎉`
    )
    .then(() => {
      helper.setHoistedRole(member, discordConfig().roles.neutral);
    });
}

export default arrive;
