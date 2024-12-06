const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

//Conexion
require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Routes
app.use(require('./src/routes/url'));

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en: http://localhost:${PORT}`);
});


