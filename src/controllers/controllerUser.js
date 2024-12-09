const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./conexion');
require('dotenv').config();
const { format } = require('date-fns')


const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';

const handleError = (res, error) => {
    console.error('Error ejecutando la consulta', error.stack);
    res.status(500).send('Error conectando a la base de datos');

};

//Función para contar todos los usuarios
const countAllUsers = async (req, res) => {
    try {
        const response = await pool.query('SELECT COUNT(*) FROM usuarios_c');
        if (response.rows.length > 0) {
            const count = response.rows[0].count;
            const countInt = parseInt(count, 10); // Conversión del resultado
            res.status(200).json({ count: countInt });
        } else {
            res.status(500).json({ error: 'No se pudo obtener la cuenta de usuarios' });
        }
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
    const { nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo, contrasena_hash, rol_id, foto_de_perfil } = req.body;
    console.log('Datos recibidos:', req.body);

    // Validación de campos obligatorios excepto nombre_2
    if (!nombre_usuario || !nombre_1 || !apellido_1 || !apellido_2 || !correo || !contrasena_hash || !rol_id) {
        return res.status(400).send('Todos los campos son obligatorios excepto el segundo nombre');
    }


    const idInt = parseInt(rol_id); if (isNaN(idInt)) {
        return res.status(400).send('El id debe ser un número entero');
    }

    try {
        // Verificar si el correo ya existe en la base de datos
        const emailCheck = await pool.query('SELECT * FROM usuarios_c WHERE correo = $1', [correo]);
        if (emailCheck.rows.length > 0) {
            console.log('El correo ya existe')
            return res.status(409).json({ error: 'El correo ya está registrado' });
        }

        // Hashea la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(contrasena_hash, 10);

        // Fecha de registro actual
        const fecha_registro = new Date();
        const fecha_formateada = format(fecha_registro, 'yyyy-MM-dd HH:mm:ss');

        const response = await pool.query(
            'INSERT INTO usuarios_c (nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo, contrasena_hash, fecha_registro, foto_de_perfil, rol_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
            [nombre_usuario, nombre_1, nombre_2 || null, apellido_1, apellido_2, correo, hashedPassword, fecha_registro, foto_de_perfil || null, rol_id]
        );

        const userId = response.rows[0].id;
        // Generar un token JWT
        const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            message: 'Usuario creado con éxito',
            token,
            userId
        });
    } catch (error) {
        handleError(res, error);
    }
}


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
    const { nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo, contrasena_hash, fecha_registro, foto_de_perfil, rol_id } = req.body;

    if (!nombre_1 || !apellido_1 || !apellido_2 || !correo || !contrasena_hash || !rol_id) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        const hashedPassword = await bcrypt.hash(contrasena_hash, 10);
        const response = await pool.query(
            'UPDATE usuarios_c SET nombre_usuario = $1, nombre_1 = $2, nombre_2 = $3, apellido_1 = $4, apellido_2 = $5, correo = $6, contrasena_hash = $7, fecha_registro =8, foto_de_perfil = $9 WHERE id = $10',
            [nombre_usuario, nombre_1, nombre_2, apellido_1, apellido_2, correo, hashedPassword, fecha_registro, foto_de_perfil, id]
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

    try {
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'contrasena_hash') {
                // Hashea la contraseña antes de actualizarla
                const hashedPassword = await bcrypt.hash(value, 10);
                fields.push(`${key} = $${idx}`);
                values.push(hashedPassword);
            } else {
                fields.push(`${key} = $${idx}`);
                values.push(value);
            }
            idx++;
        }

        const query = `UPDATE usuarios_c SET ${fields.join(', ')} WHERE id = $${idx}`;
        values.push(id);

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
    const { correo, contrasena_hash } = req.body;
    if (!correo || !contrasena_hash) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        // Buscar el usuario por nombre_usuario
        console.log('Buscando Usuario:', correo);
        const result = await pool.query('SELECT * FROM usuarios_c WHERE correo = $1', [correo]);

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

        res.json({ token, userId: user.id });
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

