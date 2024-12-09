const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const dotenv = require('dotenv');

const app = express();

// Leer el archivo de configuración
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Cargar variables de entorno según el entorno
let envFilePath;
switch (config.environment) {
    case 'local':
        envFilePath = '.env.local';
        break;
    case 'dev':
        envFilePath = '.env';
        break;
    default:
        console.error('Entorno no reconocido en config.json');
        process.exit(1);
}

// Cargar las variables de entorno desde el archivo correspondiente
dotenv.config({ path: envFilePath });

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Rutas
app.use(require('./src/routes/url'));

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en: http://localhost:${PORT}`);
});
