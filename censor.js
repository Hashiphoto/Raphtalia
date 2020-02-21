var commands = require("commands.js")

exports.censor = function(message) {
    const sender = message.guild.members.get(message.author.id);
    const regex = /(capitalism|freedom|america)/gi;
    // simple banned words
    if(message.content.match(regex) != null) {
        const fixedMessage = 'I fixed ' + sender.toString() + '\'s message\n>>> ' + message.content.replace(regex, '██████');
        message.delete();
        message.channel.send(fixedMessage);

        commands.infract(message.author.id, message.channel, 'This infraction has been recorded');
    }
    // supreme leader disrespect
    else if(message.content.match(/(long live|all hail|glory to)/gi) != null &&
            !message.mentions.roles.find(role => role.name === 'Supreme Dictator') &&
            message.content.match(/(gulag|supreme leader|leader|erkin|dictator|supreme dictator|bootylicious supreme dictator)/gi) == null) {
        commands.infract(message.author.id, message.channel, 'Glory to the Supreme Dictator _alone!_ This infraction has been recorded');
    }
    // :flag_us:
    else if(message.content.includes('🇺🇸')) {
        message.delete();
        commands.infract(message.author.id, message.channel, 'Uh, oh. ☭☭☭');
    }
}