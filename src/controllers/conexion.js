const { Pool } = require('pg');


const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: process.env.POSTGRES_PORT,
    //ssl: {
    //     rejectUnauthorized: false
    //}
});

pool.on('connect', () => { console.log('Conexión establecida con la base de datos.'); });
pool.on('error', (err) => { console.error('Error en la conexión a la base de datos:', err); });

module.exports = pool;
