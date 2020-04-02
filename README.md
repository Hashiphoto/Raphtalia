# Raphtalia Bot
The Gulag's manager

## Commands
Parameters in [brackets] are optional. + means one or more. * means 0 or more.\
The permission level is the minimum role you must have to use the command. If you do not have that role or higher, you are given an infraction.\
Basically everything is matched using regex, giving you flexibility in how you use the commands. For example, `!report @user1 @user2 +2` is identical to `!report the despicable @user1 and @user2 for crimes against the gulag. +2 demerits!`

### help 
Does nothing useful

### infractions [target]
Reports the number of infractions the target has incurred.\
If there is no target specified, the number of infractions the sender has is reported.

### kick [target]+
**Permission**: Officer\
Kick the targets from the server with a wave and a gif

### report [target]+ [number]
**Synonyms**: infract\
Increase the infraction count of the targets. This will check if they are over the limit and demote the appropriately as well.\
If no number is specified, infractions is increased by 1\
If the number is written as +3 or -2, infractions will be set relative to the target's current amount.\
If there is no +/-, infractions is set to whatever number is specified

### exile [target]+ [1d][1h][1m][1s]
**Permission**: Officer\
Exile the targets\
One or all of the time markers can be used. Ex: `!exile @user 4d 22s 3m` or `!exile @user 3s`\
If no timespan is specified, they are exiled indefinitely.\
The longest time possible is about 20 days. Any time above the limit will be shortened to the limit.\
If the server goes offline or is otherwise interrupted, all un-exile timers will be cleared.

### softkick [target]+
**Permission**: Officer\
Kick targets from the server and automatically send them an invite to join again.\
The invite does not expire, and it can be used only once.

### pardon [target]+
**Permission**: Supreme Dictator\
Clears all infractions incurred. If the target is in exile, it makes them a Comrade.

### promote [target]+
**Permission**: Officer\
Promote the targets to one rank above their current role. All hoisted roles are removed, then their previous highest role is increased by one. Un-hoisted roles are not affected.\
Promoting yourself results in an infraction.\
Promoting someone at or above your level results in an infraction.

### demote [target]+
**Permission**: Officer\
Demotes the targets to one rank above their current role. All hoisted roles are removed, then their previous highest role is decreased by one. Un-hoisted roles are not affected.\
If the target is demoted into exile, they are exiled for 24 hours.\
Demoting yourself is allowed.\
Demoting someone at or above your level results in an infraction.

### comfort [target]+
**Permission**: Supreme Dictator\
Make Raphtalia headpat someone. This does not work on other bots.

### play [in [category /] voicechannel] [0.5v]
**Permission**: Officer\
**Synonyms**: anthem, sing\
Play the Soviet Anthem.\
If a voicechannel is specified, it must be preceded with `in`. Raphtalia will try to find the voicechannel by that name.\
A category can be specified by preceding the voice channel with a slash (/). Ex: `!play in gaming/general`\
If no voicechannel is specified, it will play in the voicechannel you are in.\
Volume is 0.5 by default and goes from range 0.0 (no sound) to 1.0 (normal volume). Number may be formatted as `0.5v` or `1v` only

### banword [word]*
**Permission**: Officer\
**Synonyms**: banwords, bannedwords\
Disallow words to be used. Each word (separated by whitespace) entered after the command will be banned.\
If no words are entered, the list of banned words is printed out.

### allowword [word]*
**Permission**: Officer\
**Synonyms**: allowwords, unbanword, unbanwords\
Allows words to be used. Each word (separated by whitespace) entered after the command will be banned.\
If no words are entered, the list of banned words is printed out.

### EnableCensorship
