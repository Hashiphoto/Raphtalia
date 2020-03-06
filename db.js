const connectionConfig = require('./config/db-config.json');
var mysql = require('mysql2');

var pool = mysql.createPool({ //Create database connections
    host     : 'localhost',
    user     : connectionConfig.user,
    password : connectionConfig.password,
    database : 'raphtalia',
    connectionLimit: 5
}).promise();

console.log('Connected to db');

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

        increment: function(id) {
            return pool.query('INSERT INTO infractions VALUES (?,?) ON DUPLICATE KEY UPDATE count = count + 1', [ id, 1 ])
            .catch((error) => console.error(error));
        },
        
        set: function(id, amount) {
            return pool.query('INSERT INTO infractions VALUES (?,?) ON DUPLICATE KEY UPDATE count = VALUES(amount)', [ id, amount ])
            .catch((error) => console.error(error));
        }
    }
})();

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

        createOrUpdate: function(id, isLoyal) {
            return pool.query('INSERT INTO papers VALUES (?,?) ON DUPLICATE KEY UPDATE isLoyal = VALUES(isLoyal)', [ id, isLoyal ])
            .catch((error) => console.error(error));
        },

        delete: function(id) {
            return pool.query('DELETE FROM papers WHERE id = ?', [ id ])
            .catch((error) => console.error(error));
        }
    }
})();

module.exports = {
    infractions,
    papers
}