// Node libraries
var mysql = require('mysql2');

// Files
const secretConfig = require('./config/secrets.json')[process.env.NODE_ENV || 'dev'];

var pool = mysql.createPool({ //Create database connections
    host     : secretConfig.database.host,
    port     : secretConfig.database.port,
    user     : secretConfig.database.user,
    password : secretConfig.database.password,
    database : secretConfig.database.database,
    connectionLimit: 5
}).promise();

pool.query('SELECT 1+1')
.then(() => {
    console.log('Connected to db');
})
.catch((e) => {
    if(process.env.NODE_ENV === 'dev') {
        let command = `ssh -f ${secretConfig.database.user}@${secretConfig.ssh} -L ${secretConfig.database.port}:localhost:3306 -N`
        console.error('Can\'t connect to the database. Make sure that you are forwarding traffic to the server with the powershell command\n' + command);
    }
    else {
        console.error('Can\'t establish connection to the database\n' + e);
    }
})

/**
 * Represents the users db table
 * 
 * Object { "id": varchar, "count": int }
 */
var users = (function() {
    return {
        get: function(id, guildId) {
            return pool.query('SELECT * FROM users WHERE id = ? AND guild_id = ?', [ id, guildId ])
            .then(([rows, fields]) => {
                if(rows.length === 0) {
                    return { id: id, guild_id: guildId, infractions: 0, citizenship: false, currency: 0 };
                }
                return rows[0];
            })
            .catch((error) => console.error(error));
        },

        getGuildUsers: function(guildId) {
            return pool.query('SELECT * FROM users WHERE guild_id = ?', [ guildId ])
            .catch((error) => console.error(error));
        },

        incrementInfractions: function(id, guildId, count) {
            return pool.query('INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) ON DUPLICATE KEY UPDATE infractions = infractions + VALUES(infractions)', [ id, guildId, count ])
            .catch((error) => console.error(error));
        },
        
        setInfractions: function(id, guildId, count) {
            return pool.query('INSERT INTO users (id, guild_id, infractions) VALUES (?,?,?) ON DUPLICATE KEY UPDATE infractions = VALUES(infractions)', [ id, guildId, count ])
            .catch((error) => console.error(error));
        },

        incrementCurrency: function(id, guildId, amount) {
            return pool.query('INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) ON DUPLICATE KEY UPDATE currency = currency + VALUES(currency)', [ id, guildId, amount ])
            .catch((error) => console.error(error));
        },
        
        setCurrency: function(id, guildId, amount) {
            return pool.query('INSERT INTO users (id, guild_id, currency) VALUES (?,?,?) ON DUPLICATE KEY UPDATE currency = VALUES(currency)', [ id, guildId, amount ])
            .catch((error) => console.error(error));
        },

        setCitizenship: function(id, guildId, isCitizen) {
            return pool.query('INSERT INTO users (id, guild_id, citizenship) VALUES (?,?,?) ON DUPLICATE KEY UPDATE citizenship = VALUES(citizenship)', [ id, guildId, isCitizen ])
            .catch((error) => console.error(error));
        }
    }
})();

var bannedWords = (function() {
    return {
        getAll: function(guildId) {
            return pool.query('SELECT * FROM banned_words WHERE guild_id = ?', [ guildId ])
            .then(([rows, fields]) => {
                return rows;
            })
            .catch(e => {
                console.error(e);
            })
        },

        insert: function(wordList) {
            return pool.query('INSERT IGNORE INTO banned_words VALUES ?', [ wordList ])
            .then(([results, fields]) => {
                return results.insertId;
            })
            .catch(e => {
                console.error(e);
            })
        },

        delete: function(guildId, word) {
            return pool.query('DELETE FROM banned_words WHERE (word) IN (?) AND guild_id = ?', [ word, guildId ])
            .catch(e => {
                console.error(e);
            })
        }
    }
})();

var guilds = (function() {
    return {
        get: function(guildId) {
            return pool.query('SELECT * FROM guilds WHERE id = ?', [ guildId ])
            .then(([rows, fields]) => {
                if(rows.length === 0) {
                    return null;
                }
                return rows[0];
            })
            .catch(e => {
                console.error(e);
            })
        },

        setCensorship: function(guildId, enabled) {
            return pool.query('INSERT INTO guilds (id, censorship_enabled) VALUES (?,?) ON DUPLICATE KEY UPDATE censorship_enabled = VALUES(censorship_enabled)', [ guildId, enabled ])
            .catch((error) => console.error(error));
        },

        updateCensorshipRegex: function(guildId, regex) {
            return pool.query('INSERT INTO guilds (id, censor_regex) VALUES (?,?) ON DUPLICATE KEY UPDATE censor_regex = VALUES(censor_regex)', [ guildId, regex ])
            .catch((error) => console.error(error));
        },

        setCharacterValue: function(guildId, characterValue) {
            return pool.query('INSERT INTO guilds (id, character_value) VALUES (?,?) ON DUPLICATE KEY UPDATE character_value = VALUES(character_value)', [ guildId, characterValue ])
            .catch((error) => console.error(error));
        },

        setMaxPayout: function(guildId, maxPayout) {
            return pool.query('INSERT INTO guilds (id, max_payout) VALUES (?,?) ON DUPLICATE KEY UPDATE max_payout = VALUES(max_payout)', [ guildId, maxPayout ])
            .catch((error) => console.error(error));
        },

        setBasePayout: function(guildId, basePayout) {
            return pool.query('INSERT INTO guilds (id, base_payout) VALUES (?,?) ON DUPLICATE KEY UPDATE base_payout = VALUES(base_payout)', [ guildId, basePayout ])
            .catch((error) => console.error(error));
        },

        setMinLength: function(guildId, minLength) {
            return pool.query('INSERT INTO guilds (id, min_length) VALUES (?,?) ON DUPLICATE KEY UPDATE min_length = VALUES(min_length)', [ guildId, minLength ])
            .catch((error) => console.error(error));
        },

        setTaxRate: function(guildId, taxRate) {
            return pool.query('INSERT INTO guilds (id, tax_rate) VALUES (?,?) ON DUPLICATE KEY UPDATE tax_rate = VALUES(tax_rate)', [ guildId, taxRate ])
            .catch((error) => console.error(error));
        },

        setBaseIncome: function(guildId, baseIncome) {
            return pool.query('INSERT INTO guilds (id, base_income) VALUES (?,?) ON DUPLICATE KEY UPDATE base_income = VALUES(base_income)', [ guildId, baseIncome ])
            .catch((error) => console.error(error));
        },

        setStatusMessage: function(guildId, messageId) {
            return pool.query('INSERT INTO guilds (id, status_message_id) VALUES (?,?) ON DUPLICATE KEY UPDATE status_message_id = VALUES(status_message_id)', [ guildId, messageId ])
            .catch((error) => console.error(error));
        }
    }
})();

var channels = (function() {
    return {
        get: function(channelId) {
            return pool.query('SELECT * FROM channels WHERE id = ?', [ channelId ])
            .then(([rows, fields]) => {
                if(rows.length === 0) {
                    return null;
                }
                return rows[0];
            })
            .catch(e => {
                console.error(e);
            })
        },

        setAutoDelete: function(channelId, deleteDelay) {
            return pool.query('INSERT INTO channels (id, delete_ms) VALUES (?,?) ON DUPLICATE KEY UPDATE delete_ms = VALUES(delete_ms)', [ channelId, deleteDelay ])
            .catch((error) => console.error(error));
        }
    }
})();

var roles = (function() {
    return {
        getSingle: function(roleId) {
            return pool.query('SELECT * FROM roles WHERE id = ?', [ roleId ])
            .then(([rows, fields]) => {
                if(rows.length === 0) {
                    return { id: roleId, income: 0, price: 0 };
                }
                return rows[0];
            })
            .catch(e => {
                console.error(e);
            })
        },

        getMulti: function(roleIds) {
            return pool.query('SELECT * FROM roles WHERE id IN (?)', [ roleIds ])
            .then(([rows, fields]) => {
                return rows;
            })
            .catch((error) => console.error(error));
        },

        setRoleIncome: function(roleId, income) {
            return pool.query('INSERT INTO roles (id, income) VALUES (?,?) ON DUPLICATE KEY UPDATE income = VALUES(income)', [ roleId, income ])
            .catch((error) => console.error(error));
        },

        setRolePrice: function(roleId, price) {
            return pool.query('INSERT INTO roles (id, price) VALUES (?,?) ON DUPLICATE KEY UPDATE price = VALUES(price)', [ roleId, price ])
            .catch((error) => console.error(error));
        }
    }
})();

module.exports = {
    users,
    bannedWords,
    guilds,
    channels,
    roles
}