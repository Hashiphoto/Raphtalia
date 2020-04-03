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
        console.log('Can\'t connect to the database. Make sure that you are forwarding traffic to the server with the powershell command\n' + command);
        fail; // This isn't defined on purpose. Look carefully at the error message you're given and do that
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
        get: function(id) {
            return pool.query('SELECT * FROM users WHERE id = ?', [ id ])
            .then(([rows, fields]) => {
                if(rows.length === 0) {
                    return { id: id, infractions: 0, citizenship: false };
                }
                return rows[0];
            })
            .catch((error) => console.error(error));
        },

        updateOrCreate: function(id, user) {
            return pool.query('REPLACE INTO users VALUES (?,?)', [ user.id, user.infractions, user.citizenship ])
            .catch((error) => console.error(error));
        },

        incrementInfractions: function(id, count) {
            return pool.query('INSERT INTO users (id, infractions) VALUES (?,?) ON DUPLICATE KEY UPDATE infractions = infractions + VALUES(infractions)', [ id, count ])
            .catch((error) => console.error(error));
        },
        
        setInfractions: function(id, count) {
            return pool.query('INSERT INTO users (id, infractions) VALUES (?,?) ON DUPLICATE KEY UPDATE infractions = VALUES(infractions)', [ id, count ])
            .catch((error) => console.error(error));
        },

        setCitizenship: function(id, isCitizen) {
            return pool.query('INSERT INTO users (id, citizenship) VALUES (?,?) ON DUPLICATE KEY UPDATE citizenship = VALUES(citizenship)', [ id, isCitizen ])
            .catch((error) => console.error(error));
        }
    }
})();

var bannedWords = (function() {
    return {
        getAll: function() {
            return pool.query('SELECT * FROM bannedwords')
            .then(([rows, fields]) => {
                return rows;
            })
            .catch(e => {
                console.error(e);
            })
        },

        insert: function(word) {
            return pool.query('INSERT INTO bannedwords (word) VALUES ?', [ word ])
            .then(([results, fields]) => {
                return results.insertId;
            })
            .catch(e => {
                console.error(e);
            })
        },

        delete: function(word) {
            return pool.query('DELETE FROM bannedwords WHERE (word) IN (?)', [ word ])
            .catch(e => {
                console.error(e);
            })
        }
    }
})();

var configuration = (function() {
    return {
        /**
         * Get the current configuration. There will always be only 1 row in the table
         */
        get: function() {
            return pool.query('SELECT * FROM configuration')
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

        update: function(censorshipEnabled) {
            return pool.query('UPDATE configuration SET censorshipEnabled = ?', [ censorshipEnabled ])
        }
    }
})();

module.exports = {
    users,
    bannedWords,
    configuration
}