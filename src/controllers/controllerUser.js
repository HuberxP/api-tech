const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./conexion');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';

const handleError = (res, error) => {
    console.error('Error ejecutando la consulta', error.stack);
    res.status(500).send('Error conectando a la base de datos');
};

//Función para contar todos los usuarios
const countAllUsers = async (req, res) => {
    try {
        const response = await pool.query('SELECT COUNT(*) FROM usuarios_c');
        const count = parseInt(response.rows[0].count, 10);
        res.status(200).json({ count });
    } catch (error) {
        handleError(res, error);
    }
};

// Rutas y controladores de usuarios
const getUsers = async (req, res) => {
    try {
        const response = await pool.query('SELECT * FROM usuarios_c');
        res.status(200).json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};

const createUser = async (req, res) => {
    const { nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo,  contrasena_hash, fecha_registro,  rol_id } = req.body;
    if (!nombre_usuario || !nombre_1 || !apellido_1 || !apellido_2 || !correo || contrasena_hash || rol_id) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        // Hashea la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(contrasena_hash, 10);
        const response = await pool.query(
            'INSERT INTO usuarios_c (nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo,  contrasena_hash, fecha_registro,  rol_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo, hashedPassword, fecha_registro, rol_id]
        );
        res.json({
            message: 'Usuario creado con éxito',
            body: {
                user: { nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo, hashedPassword, fecha_registro, rol_id }
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getUserbyId = async (req, res) => {
    const id = req.params.id;
    try {
        const response = await pool.query('SELECT * FROM usuarios_c WHERE id = $1', [id]);
        if (response.rows.length === 0) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.json(response.rows);
    } catch (error) {
        handleError(res, error);
    }
};

const updateUser = async (req, res) => {
    const id = req.params.id;
    const { nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo, contrasena_hash, fecha_registro, rol_id } = req.body;

    if (!nombre_usuario || !nombre_1 || !apellido_1 || !apellido_2 || !correo || contrasena_hash || rol_id) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        const hashedPassword = await bcrypt.hash(contraseña, 10);
        const response = await pool.query(
            'UPDATE usuarios_c SET nombre_usuario = $1, nombre_1 = $2, nombre_2 = $3, apellido_1 = $4, apellido_2 = $5, correo = $6, contrasena_hash = $7, WHERE id = $8',
            [nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo, contrasena_hash, id]
        );
        if (response.rowCount === 0) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.json(`Usuario ${id} actualizado con éxito`);
    } catch (error) {
        handleError(res, error);
    }
};

const deleteUser = async (req, res) => {
    const id = req.params.id;
    try {
        const response = await pool.query('DELETE FROM usuarios_c WHERE id = $1', [id]);
        if (response.rowCount === 0) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.json(`Usuario ${id} eliminado con éxito`);
    } catch (error) {
        handleError(res, error);
    }
};

const patchUser = async (req, res) => {
    const id = req.params.id;
    const updates = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
    }

    const query = `UPDATE usuarios_c SET ${fields.join(', ')} WHERE id = $${idx}`;
    values.push(id);

    try {
        const response = await pool.query(query, values);
        if (response.rowCount === 0) {
            return res.status(404).send('Usuario no encontrado');
        }
        res.json(`Usuario ${id} actualizado parcialmente con éxito`);
    } catch (error) {
        handleError(res, error);
    }
};

const optionsHandler = (req, res) => {
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.json({ message: 'Métodos encontrados, revisa el Header' });
};

// Nueva ruta para inicio de sesión
const loginUser = async (req, res) => {
    const { nombre_usuario, contrasena_hash } = req.body;
    if (!nombre_usuario || !contrasena_hash) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        // Buscar el usuario por nombre_usuario
        console.log('Buscando usuario:', nombre_usuario);
        const result = await pool.query('SELECT * FROM usuarios_c WHERE nombre_usuario = $1', [nombre_usuario]);

        if (result.rows.length === 0) {
            console.log('Usuario no encontrado');
            return res.status(404).send('Usuario no encontrado');
        }

        const user = result.rows[0];
        console.log('Usuario encontrado:', user);

        const storedPassword = user.contrasena_hash.toString('utf-8');

        // Comparar la contraseña ingresada con la almacenada
        const match = await bcrypt.compare(contrasena_hash, storedPassword);
        console.log('Comparación de contraseña:', match);

        if (!match) {
            console.log('Credenciales inválidas');
            return res.status(401).send('Credenciales inválidas');
        }

        // Generar un token JWT
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        console.log('Token generado:', token);

        res.json({ token });
    } catch (error) {
        console.error('Error en loginUser:', error.stack);
        handleError(res, error);
    }
};


module.exports = {
    getUsers,
    createUser,
    getUserbyId,
    updateUser,
    deleteUser,
    patchUser,
    optionsHandler,
    loginUser,
    countAllUsers
};
