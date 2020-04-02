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
 * Represents the infractions db table
 * 
 * Object { "id": varchar, "count": int }
 */
var infractions = (function() {
    return {
        get: function(id) {
            return pool.query('SELECT * FROM infractions WHERE id = ?', [ id ])
            .then(([rows, fields]) => {
                if(rows.length === 0) {
                    return 0;
                }
                return rows[0].count;
            })
            .catch((error) => console.error(error));
        },

        increment: function(id, count) {
            return pool.query('INSERT INTO infractions VALUES (?,?) ON DUPLICATE KEY UPDATE count = count + VALUES(count)', [ id, count ])
            .catch((error) => console.error(error));
        },
        
        set: function(id, count) {
            return pool.query('INSERT INTO infractions VALUES (?,?) ON DUPLICATE KEY UPDATE count = VALUES(count)', [ id, count ])
            .catch((error) => console.error(error));
        }
    }
})();

/**
 * Represents the papers db table
 * 
 * Object { "id": varchar, "nickname": tinyint, "business": tinyint, "risk": tinyint, "loyalty": tinyint }
 */
var papers = (function() {
    return {        
        get: function(id) {
            return pool.query('SELECT * FROM papers WHERE id = ?', [ id ])
            .then(([rows, fields]) => {
                if(rows.length === 0) {
                    return null;
                }
                return rows[0];
            })
            .catch((error) => console.error(error));
        },

        insert: function(paper) {
            return pool.query('INSERT IGNORE INTO papers VALUES (?,?,?,?,?)', 
            [ paper.id, paper.nickname, paper.business, paper.risk, paper.loyalty ])
            .catch((error) => console.error(error));
        },

        createOrUpdate: function(id, paper = null) {
            if(paper == null) {
                paper = { 'id': id, 'nickname': false, 'business': false, 'risk': false, 'loyalty': false };
            }
            return pool.query('INSERT INTO papers VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), business = VALUES(business), risk = VALUES(risk), loyalty = VALUES(loyalty)', 
            [ paper.id, paper.nickname, paper.business, paper.risk, paper.loyalty ])
            .then(() => {
                return paper;
            })
            .catch((error) => console.error(error));
        },

        delete: function(id) {
            return pool.query('DELETE FROM papers WHERE id = ?', [ id ])
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
    infractions,
    papers,
    bannedWords,
    configuration
}