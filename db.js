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

module.exports = {
    infractions,
    papers
}