var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    port     :  8889,
    user     : 'WesleysetinaMBP',
    password : '',
    database : 'testDB'
});

connection.connect(function(err) {
    if (err) throw err;
});

module.exports = connection;