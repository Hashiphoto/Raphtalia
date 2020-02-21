const Discord = require('discord.js');
const Sequelize = require('sequelize');
var discordConfig;
const connection = require('./config/db-config.json');
const client = new Discord.Client();
var sequelize = new Sequelize('mysql://'+connection.user+':'+connection.password+'@localhost:3306/raphtalia');

var commandSwitch = require('./commandswitch.js') //include the module
let processCommand = commandSwitch.processCommand; //import the function
const prefix = commandSwitch.prefix;


var censorfile = require('./censor.js')
var censor = censorfile.censor;

if(process.argv.length < 3) {
    console.log('Please specify -d dev or -m master');
    throw new Error("No branch specified");
}

process.argv.forEach(function(value, index, array) {
    // skip 'node' and the name of the app
    if(index < 2) {
        return;
    }
    if(value === '-d') {
        discordConfig = require('./config/discord-config-development.json');
    }
    else if(value === '-m') {
        discordConfig = require('./config/discord-config-master.json');
    }
})

console.log('Connected!');
// When the client is ready, run this code
// This event will only trigger one time after logging in
client.once('ready', () => {
    // Login to Discord with your app's token
    console.log('Ready!');
    sequelize.sync({ force: false }).then(() => {
        console.log('Database synced!');
    })
    var today = new Date();
    var now = today.getHours + ":" + today.getMinutes() + ":" + today.getSeconds
    console.log(now);
});

client.login(discordConfig.token).then(() => {
    console.log('Logged in!');
});

client.on('message', message => {
    
    if(message.author.bot) {
        return;
    }

    if(message.content.startsWith(prefix)) {
        processCommand(message);
    }
    else {
        censor(message)
    }
})

client.on("disconnect", function(event) {
    console.log('Bot disconnecting');
    process.exit();
});
