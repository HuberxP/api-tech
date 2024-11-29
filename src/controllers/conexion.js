const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'postgres',
    database: 'practica-tech',
    port: '5432',
    //ssl: {
    //    rejectUnauthorized: false
    //}
});

module.exports = pool;
